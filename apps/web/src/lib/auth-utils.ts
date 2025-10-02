import { createClient } from '@/lib/supabase-client'

export async function refreshAuthSession() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
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
  if (error?.message?.includes('Auth session missing')) {
    // Try to refresh the session
    const refreshResult = await refreshAuthSession()
    
    if (!refreshResult.success) {
      // Redirect to login if refresh fails
      window.location.href = '/login'
      return false
    }
    
    return true // Session refreshed successfully
  }
  
  return false // Not an auth error we can handle
}

export function isAuthError(error: any): boolean {
  return error?.status === 401 || 
         error?.message?.includes('Auth session missing') ||
         error?.message?.includes('Authentication required')
}