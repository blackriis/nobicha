import { createClient } from '@/lib/supabase-client'

export async function refreshAuthSession() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      // Check for invalid refresh token errors
      if (error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('refresh_token_not_found')) {
        console.warn('Refresh token is invalid or not found - clearing session')
        // Clear the session and storage
        await supabase.auth.signOut()
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sb-' + supabase.supabaseUrl.split('//')[1].split('.')[0] + '-auth-token')
        }
        return { success: false, error, requiresReauth: true }
      }
      console.error('Failed to refresh session:', error)
      return { success: false, error }
    }
    
    return { success: true, session: data.session }
  } catch (error) {
    console.error('Unexpected error refreshing session:', error)
    return { success: false, error }
  }
}

export async function handleAuthError(error: any) {
  // Check for invalid refresh token errors
  if (error?.message?.includes('Invalid Refresh Token') || 
      error?.message?.includes('Refresh Token Not Found') ||
      error?.message?.includes('refresh_token_not_found')) {
    console.warn('Invalid refresh token detected - redirecting to login')
    // Clear session and redirect to login
    if (typeof window !== 'undefined') {
      // Clear auth storage
      const supabase = createClient()
      await supabase.auth.signOut().catch(() => {})
      // Redirect to login
      window.location.href = '/login'
    }
    return false
  }
  
  if (error?.message?.includes('Auth session missing')) {
    // Try to refresh the session
    const refreshResult = await refreshAuthSession()
    
    if (!refreshResult.success) {
      // If refresh requires reauth, redirect immediately
      if (refreshResult.requiresReauth) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return false
      }
      // Redirect to login if refresh fails
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return false
    }
    
    return true // Session refreshed successfully
  }
  
  return false // Not an auth error we can handle
}

export function isAuthError(error: any): boolean {
  return error?.status === 401 || 
         error?.message?.includes('Auth session missing') ||
         error?.message?.includes('Authentication required') ||
         error?.message?.includes('Invalid Refresh Token') ||
         error?.message?.includes('Refresh Token Not Found') ||
         error?.message?.includes('refresh_token_not_found')
}