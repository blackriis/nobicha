import { createClientComponentClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@employee-management/database'
import { validateSignInData, validateSignUpData, isEmail } from './validation'
import { userCache } from './user-cache'
import { config } from '@employee-management/config'

export type UserProfile = Database['public']['Tables']['users']['Row']
export type UserRole = Database['public']['Enums']['user_role']

export interface AuthUser extends User {
  profile?: UserProfile
}

// Auth utility functions
export const auth = {
  // Sign in with email or username and password
  async signIn(identifier: string, password: string) {
    // Validate input (accepts both email and username)
    const validation = validateSignInData(identifier, password)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Check Supabase configuration before attempting sign in
    try {
      const url = config.supabase.url
      const anonKey = config.supabase.anonKey

      if (!url || url.includes('placeholder') || !anonKey || anonKey.includes('placeholder')) {
        throw new Error('Supabase configuration is missing or invalid. Please check your environment variables.')
      }
    } catch (configError) {
      console.error('❌ Supabase configuration error:', configError)
      throw new Error('ระบบยังไม่ได้ตั้งค่า Supabase กรุณาตรวจสอบการตั้งค่าและ restart server')
    }

    try {
      // Determine if input is email or username
      const sanitizedIdentifier = validation.sanitized!.email
      let emailForLogin = sanitizedIdentifier

      // If it's not an email format, lookup the username to get email
      if (!isEmail(sanitizedIdentifier)) {
        console.log('🔍 Input is username, looking up email...')

        try {
          const lookupResponse = await fetch('/api/auth/lookup-username', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: sanitizedIdentifier }),
          })

          if (!lookupResponse.ok) {
            const errorData = await lookupResponse.json()
            console.warn('Username lookup failed:', errorData)
            throw new Error('Invalid login credentials')
          }

          const lookupData = await lookupResponse.json()

          if (!lookupData.success || !lookupData.email) {
            throw new Error('Invalid login credentials')
          }

          emailForLogin = lookupData.email
          console.log('✅ Username lookup successful')
        } catch (lookupError) {
          console.error('❌ Username lookup error:', lookupError)
          throw new Error('Invalid login credentials')
        }
      }

      const supabase = createClientComponentClient()

      // Add better error handling for network issues
      console.log('🔐 Attempting sign in with Supabase...', {
        identifier: sanitizedIdentifier,
        email: emailForLogin,
        supabaseUrl: config.supabase.url,
        hasKey: !!config.supabase.anonKey
      })

      // Wrap signInWithPassword with timeout and better error handling
      const signInPromise = supabase.auth.signInWithPassword({
        email: emailForLogin,
        password,
      })

      // Add timeout to prevent hanging requests (30 seconds)
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Request timeout: การเชื่อมต่อใช้เวลานานเกินไป'))
        }, 30000)
      })

      try {
        const result = await Promise.race([
          signInPromise.then(result => {
            if (timeoutId) clearTimeout(timeoutId)
            return result
          }),
          timeoutPromise
        ])

        const { data, error } = result

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
          try {
            const profile = await getUserProfile(data.user.id)
            
            if (profile) {
              console.log('✅ User profile loaded successfully')
              return { ...data, user: { ...data.user, profile } as AuthUser }
            } else {
              console.warn('⚠️ User profile not found, but login successful. User can continue without profile.')
              // Return user without profile - AuthProvider can handle this case
              return { ...data, user: { ...data.user, profile: undefined } as AuthUser }
            }
          } catch (profileError) {
            // Log the error but don't fail the sign in
            const errorMessage = profileError instanceof Error ? profileError.message : String(profileError)
            const errorName = profileError instanceof Error ? profileError.name : 'UnknownError'
            
            console.error('⚠️ Failed to fetch user profile after sign in (non-blocking):', {
              userId: data.user.id,
              errorName,
              errorMessage,
              timestamp: new Date().toISOString()
            })
            
            // Return user without profile - sign in was successful
            // The user can still use the app, and profile can be loaded later
            return { ...data, user: { ...data.user, profile: undefined } as AuthUser }
          }
        }

        return data
      } catch (raceError) {
        // Handle timeout or other race errors
        if (timeoutId) clearTimeout(timeoutId)
        throw raceError
      }
    } catch (error) {
      // Enhanced error handling for fetch failures
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        const errorName = error.name

        // Network connectivity errors (DNS, connection refused, etc.)
        if (errorMessage.includes('failed to fetch') ||
            errorMessage.includes('fetch failed') ||
            errorMessage.includes('network request failed') ||
            errorMessage.includes('networkerror') ||
            errorName === 'TypeError' ||
            errorName === 'NetworkError' ||
            errorMessage.includes('network')) {
          console.error('🌐 Network connectivity error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          })

          // More specific error message for better troubleshooting
          throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบ:\n' +
            '1. การเชื่อมต่ออินเทอร์เน็ต\n' +
            '2. Firewall หรือ VPN ที่อาจบล็อกการเชื่อมต่อ\n' +
            '3. สถานะของ Supabase project (ดูที่ dashboard)\n' +
            '4. ลอง restart development server และลองใหม่อีกครั้ง')
        }

        // Timeout errors
        if (errorMessage.includes('timeout') || errorMessage.includes('request timeout')) {
          console.error('⏱️ Request timeout error:', {
            message: error.message,
            name: error.name
          })
          throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาตรวจสอบความเร็วของอินเทอร์เน็ตและลองใหม่')
        }

        // Configuration errors
        if (errorMessage.includes('configuration') ||
            errorMessage.includes('not configured') ||
            errorMessage.includes('invalid supabase url')) {
          console.error('⚙️ Configuration error:', {
            message: error.message,
            name: error.name
          })
          throw new Error('การตั้งค่า Supabase ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบหรือตรวจสอบไฟล์ .env.local')
        }
      }

      // Re-throw original error if not handled above
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
        // Handle invalid refresh token errors
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('refresh_token_not_found')) {
          console.warn('Invalid refresh token in getSession - clearing session')
          // Clear session
          await supabase.auth.signOut().catch(() => {})
          return { session: null }
        }
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
        // Handle invalid refresh token errors
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('refresh_token_not_found')) {
          console.warn('Invalid refresh token in getUser - clearing session')
          // Clear session
          await supabase.auth.signOut().catch(() => {})
          return { user: null }
        }
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
    
    // Use enhanced fetch with error handling
    const { fetchWithErrorHandling } = await import('@/lib/fetch-utils')
    
    let response: Response
    try {
      response = await fetchWithErrorHandling('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include', // Include auth cookies
        timeout: 15000,
        retries: 1
      })
    } catch (fetchError) {
      // Handle fetch errors (network, timeout, etc.)
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError)
      const errorName = fetchError instanceof Error ? fetchError.name : 'UnknownError'
      const errorCode = (fetchError as any)?.code || 'UNKNOWN'
      
      console.error('Profile fetch failed (network/timeout error):', {
        userId,
        errorName,
        errorMessage,
        errorCode,
        timestamp: new Date().toISOString()
      })
      
      // Re-throw with better error message
      throw new Error(`Failed to fetch user profile: ${errorMessage} (${errorCode})`)
    }
    
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

      // Log other errors with detailed information
      console.error('=== Profile API Error ===')
      console.error('HTTP Status:', response.status, response.statusText)
      console.error('User ID:', userId)
      console.error('URL:', response.url)
      console.error('Timestamp:', new Date().toISOString())
      console.error('Error Message:', errorData.message || 'Unknown error')
      console.error('Error Code:', errorData.code || 'UNKNOWN')
      console.error('Error Data Keys:', Object.keys(errorData).join(', '))
      console.error('Raw Response Length:', rawResponseText?.length || 0)
      console.error('Content-Type:', response.headers.get('content-type') || 'No content type')
      console.error('Raw Response:', rawResponseText || 'Empty response')
      if (Object.keys(errorData).length > 0) {
        console.error('Error Data (JSON):', JSON.stringify(errorData, null, 2))
      }
      console.error('=========================')
      
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
    // Enhanced error logging with clear output
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorStack = error instanceof Error ? error.stack : undefined

    // Log with clear, line-by-line output
    console.error('=== Profile Fetch Error ===')
    console.error('User ID:', userId)
    console.error('Error Name:', errorName)
    console.error('Error Message:', errorMessage)
    console.error('Has Stack:', !!errorStack)
    console.error('Timestamp:', new Date().toISOString())

    // Log detailed error information
    if (error instanceof Error && errorStack) {
      console.error('Stack Preview:')
      console.error(errorStack.split('\n').slice(0, 5).join('\n'))
    } else if (!(error instanceof Error)) {
      console.error('Error Type:', typeof error)
      console.error('Error Value:', String(error))
      try {
        console.error('Error JSON:', JSON.stringify(error, null, 2))
      } catch {
        console.error('Could not stringify error')
      }
    }
    console.error('========================')

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
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.name : 'UnknownError'

    console.error('=== Error Creating User Profile ===')
    console.error('User ID:', user.id)
    console.error('Error Name:', errorName)
    console.error('Error Message:', errorMessage)
    console.error('Timestamp:', new Date().toISOString())

    if (error instanceof Error && error.stack) {
      console.error('Stack Preview:')
      console.error(error.stack.split('\n').slice(0, 5).join('\n'))
    } else if (!(error instanceof Error)) {
      console.error('Error Type:', typeof error)
      try {
        console.error('Error JSON:', JSON.stringify(error, null, 2))
      } catch {
        console.error('Could not stringify error')
      }
    }
    console.error('===================================')

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
