import { createClientComponentClient } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@employee-management/database'
import { validateSignInData, validateSignUpData } from './validation'
import { userCache } from './user-cache'

export type UserProfile = Database['public']['Tables']['users']['Row']
export type UserRole = Database['public']['Enums']['user_role']

export interface AuthUser extends User {
  profile?: UserProfile
}

// Auth utility functions
export const auth = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    // Validate input
    const validation = validateSignInData(email, password)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
    
    try {
      const supabase = createClientComponentClient()
      
      // Add better error handling for network issues
      console.log('🔐 Attempting sign in with Supabase...', {
        email: validation.sanitized!.email,
        supabaseUrl: supabase.supabaseUrl,
        hasKey: !!supabase.supabaseKey
      })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.sanitized!.email,
        password,
      })
      
      if (error) {
        console.error('❌ Supabase auth error:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        throw error
      }
      
      console.log('✅ Sign in successful')
      
      // Get user profile after successful login
      if (data.user) {
        const profile = await getUserProfile(data.user.id)
        return { ...data, user: { ...data.user, profile } as AuthUser }
      }
      
      return data
    } catch (error) {
      // Enhanced error handling for fetch failures
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
          console.error('🌐 Network connectivity error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          })
          throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต')
        }
      }
      throw error
    }
  },

  // Sign up with email, password and role
  async signUp(email: string, password: string, fullName: string, role: UserRole = 'employee') {
    // Validate input
    const validation = validateSignUpData(email, password, fullName, role)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
    
    const sanitized = validation.sanitized!
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.auth.signUp({
      email: sanitized.email,
      password,
      options: {
        data: {
          full_name: sanitized.fullName,
          role: sanitized.role,
        },
      },
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const supabase = createClientComponentClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current session (WARNING: session.user is not authenticated - use getUser() for security-critical operations)
  async getSession() {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        // Handle AuthSessionMissingError gracefully
        if (error.message?.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
          console.warn('Auth session missing in getSession - returning null session')
          return { session: null }
        }
        throw error
      }
      
      // Return session without modifying user object for backward compatibility
      // Note: Do not use session.user for security-critical operations
      return data
    } catch (error) {
      // Fallback error handling
      console.error('Unexpected error in getSession:', error)
      return { session: null }
    }
  },

  // Get current user with profile
  async getUser() {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        // Handle AuthSessionMissingError gracefully
        if (error.message?.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
          console.warn('Auth session missing in getUser - returning null user')
          return { user: null }
        }
        throw error
      }
      
      if (data.user) {
        console.log('Auth user found, fetching profile for:', data.user.id)
        const profile = await getUserProfile(data.user.id)
        
        if (!profile) {
          console.warn('User authenticated but no profile found in users table. Attempting to create profile.')
          
          // Attempt to create profile automatically
          const createdProfile = await createUserProfile(data.user)
          
          if (createdProfile) {
            return { ...data, user: { ...data.user, profile: createdProfile } as AuthUser }
          } else {
            // Return user without profile - AuthProvider can handle this case
            return { ...data, user: { ...data.user, profile: undefined } as AuthUser }
          }
        }
        
        return { ...data, user: { ...data.user, profile } as AuthUser }
      }
      
      return data
    } catch (error) {
      // Fallback error handling
      console.error('Unexpected error in getUser:', error)
      return { user: null }
    }
  },

  // Listen to auth changes (WARNING: session.user is not authenticated - caller should re-authenticate with getUser())
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    const supabase = createClientComponentClient()
    return supabase.auth.onAuthStateChange((event, session) => {
      // Pass session as-is without modifying user object
      // Caller should use getUser() to re-authenticate the user
      callback(event, session)
    })
  },
}

// Get user profile from users table (with caching) - Now uses API route to avoid RLS issues
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // Check cache first
  const cached = userCache.get(userId)
  if (cached) {
    return cached
  }

  try {
    console.log('Fetching user profile via API for userId:', userId)
    
    // Get current session to extract access token
    const supabase = createClientComponentClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.warn('Session error for profile fetch:', {
        error: sessionError.message,
        code: sessionError.name,
        userId
      })
      return null
    }
    
    if (!session?.access_token) {
      console.warn('No valid session for profile fetch:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId
      })
      return null
    }
    
    console.log('Making API request to /api/user/profile with token:', {
      hasToken: !!session.access_token,
      tokenLength: session.access_token?.length,
      userId,
      tokenPreview: session.access_token ? session.access_token.substring(0, 20) + '...' : 'No token'
    })
    
    const response = await fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include' // Include auth cookies
    })
    
    console.log('API response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url,
      contentType: response.headers.get('content-type'),
      userId,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      let errorData: Record<string, unknown> = {}
      let rawResponseText = ''
      
      try {
        // First get the raw text to see what server actually returns
        rawResponseText = await response.clone().text()
        console.log('Raw API error response:', rawResponseText)
        console.log('Raw response length:', rawResponseText.length)
        console.log('Raw response type:', typeof rawResponseText)
        
        // Then try to parse as JSON
        if (rawResponseText.trim()) {
          try {
            errorData = JSON.parse(rawResponseText)
            console.log('Parsed error data:', errorData)
          } catch (parseError) {
            console.error('JSON parse error:', parseError)
            errorData = { 
              message: 'Invalid JSON response',
              rawResponse: rawResponseText,
              parseError: parseError instanceof Error ? parseError.message : parseError
            }
          }
        } else {
          errorData = { message: 'Empty response from server' }
        }
      } catch (jsonError) {
        console.warn('Failed to parse error response as JSON:', {
          jsonError: jsonError instanceof Error ? jsonError.message : jsonError,
          rawResponse: rawResponseText,
          contentType: response.headers.get('content-type')
        })
        errorData = { 
          message: 'Invalid error response format',
          rawResponse: rawResponseText,
          rawStatus: response.status,
          rawStatusText: response.statusText,
          contentType: response.headers.get('content-type')
        }
      }

      // Handle specific error cases with appropriate logging
      if (response.status === 401) {
        console.warn('User not authenticated for profile fetch', {
          code: errorData.code || 'AUTH_REQUIRED',
          message: errorData.message || 'Authentication required'
        })
        return null
      }
      
      if (response.status === 404) {
        console.warn('User profile not found', {
          userId,
          code: errorData.code || 'PROFILE_NOT_FOUND',
          message: errorData.message || 'Profile not found'
        })
        return null
      }

      // Log other errors with structured information  
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        userId,
        errorData,
        rawResponse: rawResponseText,
        contentType: response.headers.get('content-type'),
        timestamp: new Date().toISOString()
      }
      
      // More detailed error logging
      console.error('Profile API error:', {
        status: response.status,
        statusText: response.statusText,
        userId,
        errorMessage: errorData.message || 'Unknown error',
        errorCode: errorData.code || 'UNKNOWN',
        timestamp: new Date().toISOString()
      })
      
      // Log individual error properties for better debugging
      console.error('Profile API error details:', {
        'HTTP Status': response.status,
        'Status Text': response.statusText,
        'User ID': userId,
        'Error Message': errorData.message || 'No message',
        'Error Code': errorData.code || 'No code',
        'Raw Response': rawResponseText || 'No raw response',
        'Content Type': response.headers.get('content-type') || 'No content type'
      })
      
      // Extra explicit log to avoid collapsed empty object in some consoles
      if (rawResponseText) {
        console.error('Profile API raw response:', rawResponseText)
      }
      
      // Log the full error details for debugging
      console.error('Full error details:', errorDetails)
      
      return null
    }

    const result = await response.json()
    
    if (!result.success || !result.profile) {
      console.warn('Profile API returned unsuccessful result:', result)
      return null
    }

    const profile = result.profile as UserProfile
    
    console.log('getUserProfile success:', {
      userId,
      profile: { 
        id: profile.id, 
        email: profile.email, 
        full_name: profile.full_name, 
        role: profile.role 
      }
    })

    // Cache the result
    userCache.set(userId, profile)
    return profile

  } catch (error) {
    const errorInfo = {
      userId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    }
    console.error('Error fetching user profile via API:', errorInfo)
    
    // Also log the error separately for better visibility
    if (error instanceof Error) {
      console.error('Profile fetch error details:', error.message)
    } else {
      console.error('Profile fetch unknown error:', error)
    }
    
    return null
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('users')
    .update(updates as never)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  // Update cache with new data
  if (data) {
    userCache.set(userId, data as UserProfile)
    return data as UserProfile
  } else {
    // If update successful but no data returned, invalidate cache and throw error
    userCache.delete(userId)
    throw new Error('Update successful but no data returned')
  }
}

// Check if user has admin role
export function isAdmin(user: AuthUser | null): boolean {
  return user?.profile?.role === 'admin'
}

// Check if user has employee role
export function isEmployee(user: AuthUser | null): boolean {
  return user?.profile?.role === 'employee'
}

// Create user profile automatically if missing
async function createUserProfile(user: User): Promise<UserProfile | null> {
  try {
    console.log('Attempting to create profile for user:', user.id)
    
    // Get current session to extract access token
    const supabase = createClientComponentClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.access_token) {
      console.warn('No valid session for profile creation:', sessionError?.message || 'No access token')
      return null
    }

    const response = await fetch('/api/user/profile/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        role: user.user_metadata?.role || 'employee',
        branch_id: user.user_metadata?.branch_id || null,
        employee_id: user.user_metadata?.employee_id || null,
        phone_number: user.user_metadata?.phone_number || null
      }),
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Profile creation failed:', {
        status: response.status,
        error: errorData
      })
      return null
    }

    const result = await response.json()
    
    if (!result.success || !result.profile) {
      console.warn('Profile creation API returned unsuccessful result:', result)
      return null
    }

    const profile = result.profile as UserProfile
    
    console.log('Profile created successfully:', {
      userId: user.id,
      profile: { 
        id: profile.id, 
        email: profile.email, 
        full_name: profile.full_name, 
        role: profile.role 
      }
    })

    // Cache the created profile
    userCache.set(user.id, profile)
    return profile

  } catch (error) {
    console.error('Error creating user profile:', {
      userId: user.id,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    })
    return null
  }
}

// Get redirect URL based on user role
export function getRedirectUrl(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'employee':
      return '/dashboard'
    default:
      return '/'
  }
}
