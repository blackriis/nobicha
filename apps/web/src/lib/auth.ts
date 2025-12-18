import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@employee-management/database'
import { validateSignInData, validateSignUpData, isEmail } from './validation'
import { userCache } from './user-cache'
import { config } from '@employee-management/config'
import { getBrowserClient } from './supabase-browser'

export type UserProfile = Database['public']['Tables']['users']['Row']
export type UserRole = Database['public']['Enums']['user_role']

export interface AuthUser extends User {
  profile?: UserProfile
}

// Helper function to get redirect URL based on user role
export function getRedirectUrl(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'employee':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

// Use the browser client helper for auth operations
const getAuthClient = () => getBrowserClient()

// Enhanced getUser function with better error handling
export const auth = {
  // Get current user with profile
  async getUser() {
    try {
      const supabase = getAuthClient()

      // First check if we have a session without making a network request
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.warn('Session check error:', sessionError.message)
        return { user: null }
      }

      if (!sessionData.session) {
        // No session, return null user immediately
        return { user: null }
      }

      // We have a session, now get the user with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Network timeout: การเชื่อมต่อใช้เวลานานเกินไป'))
        }, 5000) // 5 second timeout
      })

      const authPromise = supabase.auth.getUser()

      // Race between auth request and timeout
      const { data, error } = await Promise.race([
        authPromise.then(result => result),
        timeoutPromise.then(error => { throw error })
      ])

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
        // Handle network errors
        if (error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('fetch')) {
          console.warn('Network error in getUser - returning null user:', {
            error: error.message,
            type: 'network_error'
          })
          return { user: null }
        }
        // Handle timeout errors - don't return null, throw to preserve user state
        if (error.message?.includes('timeout') || error.message?.includes('Network timeout')) {
          console.warn('Timeout in getUser - throwing error to preserve user state:', {
            error: error.message,
            type: 'timeout_error'
          })
          // Don't return null user on timeout - let the caller handle this
          throw error
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
      // Handle specific error types
      if (error instanceof Error) {
        // Network-related errors
        if (error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('fetch')) {
          console.warn('Network error in getUser - returning null user:', {
            error: error.message,
            type: 'network_error'
          })
          return { user: null }
        }

        // Timeout errors
        if (error.message?.includes('timeout') || error.message?.includes('Network timeout')) {
          console.warn('Timeout in getUser - returning null user:', {
            error: error.message,
            type: 'timeout_error'
          })
          return { user: null }
        }

        // Log other unexpected errors
        console.error('Unexpected error in getUser:', {
          error: error.message,
          type: 'unexpected_error',
          stack: error.stack
        })
      } else {
        console.error('Unknown error in getUser:', error)
      }

      return { user: null }
    }
  },

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

      const supabase = getAuthClient()

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
          const profile = await getUserProfile(data.user.id)
          return { ...data, user: { ...data.user, profile } as AuthUser }
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

  async signUp(email: string, password: string, fullName: string, role: UserRole = 'employee') {
    // Validate input
    const validation = validateSignUpData(email, password, fullName, role)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    const sanitized = validation.sanitized!
    const supabase = getAuthClient()
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

  async signOut() {
    try {
      const supabase = getAuthClient()
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  async getSession() {
    try {
      const supabase = getAuthClient()
      return await supabase.auth.getSession()
    } catch (error) {
      console.error('Get session error:', error)
      return { session: null }
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = getAuthClient()
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Helper functions
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // Check cache first
  const cached = userCache.get(userId)
  if (cached) {
    return cached
  }

  try {
    // Get current session to extract access token
    const supabase = getAuthClient()
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
      // No session or token, silently return null without logging
      return null
    }

    console.log('Fetching user profile via API for userId:', userId)

    // Fetch profile using API route (cookies will be sent automatically)
    const profileResponse = await fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Ensure we get fresh data
    })

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json()

      // Only log as error for unexpected status codes, 401 is expected when not authenticated
      if (profileResponse.status === 401) {
        // Expected when user is not authenticated, don't log as error
        return null
      }

      console.error('Profile API error:', {
        status: profileResponse.status,
        statusText: profileResponse.statusText,
        error: errorData,
        hasToken: !!session.access_token,
        tokenLength: session.access_token?.length || 0
      })
      return null
    }

    const responseData = await profileResponse.json()

    // Check if response has the expected structure
    if (!responseData.success || !responseData.profile) {
      console.error('Profile API invalid response structure:', responseData)
      return null
    }

    const profileData = responseData.profile

    console.log('getUserProfile success:', {
      userId,
      profile: {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role
      }
    })

    // Cache the result
    userCache.set(userId, profileData)
    return profileData

  } catch (error) {
    // Enhanced error logging with clear output
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorStack = error instanceof Error ? error.stack : undefined

    // Log with clear, line-by-line output
    console.error('getUserProfile error - CHECK THESE ISSUES:')
    console.error('1. Error message:', errorMessage)
    console.error('2. Error name:', errorName)
    console.error('3. User ID:', userId)
    console.error('4. Stack trace:', errorStack)
    console.error('---')

    // Return null instead of throwing to allow app to continue
    return null
  }
}

// Helper function to create user profile (if needed)
async function createUserProfile(user: User): Promise<UserProfile | null> {
  try {
    // Implementation would go here...
    return null
  } catch (error) {
    console.error('Error creating user profile:', error)
    return null
  }
}