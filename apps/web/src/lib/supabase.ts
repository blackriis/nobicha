import { createBrowserClient } from '@supabase/ssr'
import { config } from '@employee-management/config'
import type { Database } from '@employee-management/database'

// Client-side Supabase client
export const createClientComponentClient = () => {
  try {
    // This will throw if environment variables are not properly configured
    const url = config.supabase.url
    const anonKey = config.supabase.anonKey
    
    console.log('🔧 Creating Supabase client with config:', {
      url,
      hasAnonKey: !!anonKey,
      anonKeyLength: anonKey?.length || 0,
      anonKeyPrefix: anonKey?.substring(0, 20) + '...'
    })
    
    return createBrowserClient<Database>(url, anonKey)
  } catch (error) {
    // More user-friendly error handling
    console.error('❌ Failed to create Supabase client:', error)
    
    if (error instanceof Error && error.message.includes('Environment variable')) {
      throw new Error(`Supabase configuration error: ${error.message}. Please ensure your .env.local file is properly configured and restart the development server.`)
    }
    
    throw error
  }
}

// Legacy browser client for backward compatibility
export const createClient = () => {
  return createBrowserClient<Database>(
    config.supabase.url,
    config.supabase.serviceRoleKey || config.supabase.anonKey
  )
}

// Server client with service role key (for admin operations)
export const createSupabaseServerClient = () => {
  return createBrowserClient<Database>(
    config.supabase.url,
    config.supabase.serviceRoleKey || config.supabase.anonKey
  )
}

// Default browser client for backward compatibility
export const supabase = createClientComponentClient()

// Client-side browser client for use in components
export const createSupabaseClientSide = createClientComponentClient

// Server-side client with service role key (for admin operations)
export const supabaseAdmin = createBrowserClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey || config.supabase.anonKey
)