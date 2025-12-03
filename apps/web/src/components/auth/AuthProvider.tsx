'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth, type AuthUser, type UserRole } from '@/lib/auth'
import type { Session } from '@supabase/supabase-js'
import { userCache } from '@/lib/user-cache'

interface AuthContextType {
 user: AuthUser | null
 session: Session | null
 loading: boolean
 signIn: (email: string, password: string) => Promise<void>
 signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>
 signOut: () => Promise<void>
 isAdmin: boolean
 isEmployee: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
 children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
 const [user, setUser] = useState<AuthUser | null>(null)
 const [session, setSession] = useState<Session | null>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  // Get initial authenticated user (secure)
  const getInitialUser = async () => {
   try {
    // First try to get session to check if user is potentially authenticated
    const { session } = await auth.getSession()
    setSession(session)
    
    if (session?.user) {
     // If session exists, get authenticated user securely
     try {
      const { user: authenticatedUser } = await auth.getUser()
      setUser(authenticatedUser as AuthUser || null)
     } catch (profileError) {
      console.warn('Failed to get user profile during initialization:', {
       userId: session.user.id,
       error: profileError instanceof Error ? profileError.message : 'Unknown error'
      })
      // Set user without profile - they can still use the app
      setUser({ ...session.user, profile: undefined } as AuthUser)
     }
    } else {
     // No session, user is not authenticated
     setUser(null)
    }
   } catch (error) {
    // Handle invalid refresh token errors
    if (error.message?.includes('Invalid Refresh Token') || 
        error.message?.includes('Refresh Token Not Found') ||
        error.message?.includes('refresh_token_not_found')) {
     console.warn('Invalid refresh token during initialization - clearing session')
     setUser(null)
     setSession(null)
     // Clear session
     await auth.signOut().catch(() => {})
    } else if (error.message?.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
     console.warn('Auth session missing during initialization - user will need to login again')
     setUser(null)
     setSession(null)
    } else {
     console.error('Error getting initial user:', error)
     setUser(null)
     setSession(null)
    }
   } finally {
    setLoading(false)
   }
  }

  getInitialUser()

  // Listen for auth changes
  const { data: { subscription } } = auth.onAuthStateChange(
   async (event, session) => {
    // Update session first to maintain session state during navigation
    setSession(session)
    
    if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
     setUser(null)
     setSession(null)
     setLoading(false)
    } else if (event === 'SIGNED_IN' || (event === 'TOKEN_REFRESHED' && session)) {
     // When signed in or token refreshed, ensure we get user data
     if (session?.user) {
      try {
       const { user: authenticatedUser } = await auth.getUser()
       setUser(authenticatedUser as AuthUser || null)
      } catch (error) {
       // Handle invalid refresh token errors
       if (error.message?.includes('Invalid Refresh Token') || 
           error.message?.includes('Refresh Token Not Found') ||
           error.message?.includes('refresh_token_not_found')) {
        console.warn('Invalid refresh token during state change - forcing logout')
        setUser(null)
        setSession(null)
        // Clear session
        await auth.signOut().catch(() => {})
       } else if (error.message?.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
        // Don't force logout immediately - session might be temporarily unavailable during navigation
        // Keep session state and try to get user later
        console.warn('Auth session missing during state change - keeping session state')
        // Keep session state but set user to null temporarily
        setUser(null)
       } else {
        console.warn('Error re-authenticating user during state change:', {
         userId: session.user.id,
         error: error instanceof Error ? error.message : 'Unknown error'
        })
        // Set user without profile - they can still use the app
        setUser({ ...session.user, profile: undefined } as AuthUser)
       }
      }
     }
     setLoading(false)
    } else if (session?.user) {
     // For other events (like navigation), preserve session and try to get user
     // Don't clear user immediately - might be a temporary state during navigation
     try {
      const { user: authenticatedUser } = await auth.getUser()
      if (authenticatedUser) {
       setUser(authenticatedUser as AuthUser || null)
      }
      // If getUser fails but session exists, don't clear user immediately
      // This prevents logout during browser back navigation
     } catch (error) {
      // Only clear user if it's a critical auth error
      if (error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('refresh_token_not_found')) {
       console.warn('Invalid refresh token during state change - forcing logout')
       setUser(null)
       setSession(null)
       await auth.signOut().catch(() => {})
      }
      // For other errors, keep existing user state to prevent logout during navigation
     }
     setLoading(false)
    } else {
     // No session - only clear user if we're certain
     setUser(null)
     setLoading(false)
    }
   }
  )

  return () => subscription.unsubscribe()
 }, [])

 const signIn = async (email: string, password: string) => {
  try {
   const { user: signedInUser } = await auth.signIn(email, password)
   setUser(signedInUser as AuthUser)
  } catch (error) {
   throw error
  }
 }

 const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'employee') => {
  try {
   await auth.signUp(email, password, fullName, role)
   // Note: User will need to verify email before they can sign in
  } catch (error) {
   throw error
  }
 }

 const signOut = async () => {
  try {
   // Clear user from cache before signing out
   if (user?.id) {
    userCache.delete(user.id)
   }
   
   await auth.signOut()
   setUser(null)
   setSession(null)
  } catch (error) {
   throw error
  }
 }

 const value: AuthContextType = {
  user,
  session,
  loading,
  signIn,
  signUp,
  signOut,
  isAdmin: user?.profile?.role === 'admin',
  isEmployee: user?.profile?.role === 'employee',
 }

 return (
  <AuthContext.Provider value={value}>
   {children}
  </AuthContext.Provider>
 )
}

export function useAuth() {
 const context = useContext(AuthContext)
 if (context === undefined) {
  throw new Error('useAuth must be used within an AuthProvider')
 }
 return context
}