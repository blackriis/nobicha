import { createBrowserClient } from '@supabase/ssr'
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

// Enhanced getUser function with better error handling
export const auth = {
  // Get current user with profile
  async getUser() {
    try {
      const supabase = createBrowserClient<Database>(config.supabase.url, config.supabase.anonKey)

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Network timeout: การเชื่อมต่อใช้เวลานานเกินไป'))
        }, 10000) // 10 second timeout
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
        // Handle timeout errors
        if (error.message?.includes('timeout') || error.message?.includes('Network timeout')) {
          console.warn('Timeout in getUser - returning null user:', {
            error: error.message,
            type: 'timeout_error'
          })
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

  // Other auth methods remain the same...
  async signIn(identifier: string, password: string) {
    // ... (existing signIn implementation)
    return { data: null, user: null }
  },

  async signUp(email: string, password: string, fullName: string, role?: UserRole) {
    // ... (existing signUp implementation)
    return { data: null, user: null }
  },

  async signOut() {
    try {
      const supabase = createBrowserClient<Database>(config.supabase.url, config.supabase.anonKey)
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  async getSession() {
    try {
      const supabase = createBrowserClient<Database>(config.supabase.url, config.supabase.anonKey)
      return await supabase.auth.getSession()
    } catch (error) {
      console.error('Get session error:', error)
      return { session: null }
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createBrowserClient<Database>(config.supabase.url, config.supabase.anonKey)
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
    console.log('Fetching user profile via API for userId:', userId)

    // Get current session to extract access token
    const supabase = createBrowserClient<Database>(config.supabase.url, config.supabase.anonKey)
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
      console.warn('No access token available for profile fetch')
      return null
    }

    // Fetch profile using API route (server-side fetch with proper auth)
    const profileResponse = await fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Ensure we get fresh data
    })

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json()
      console.error('Profile API error:', {
        status: profileResponse.status,
        statusText: profileResponse.statusText,
        error: errorData
      })
      return null
    }

    const profileData = await profileResponse.json()

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