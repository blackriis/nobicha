import { createBrowserClient } from '@supabase/ssr'
import { config } from '@employee-management/config'
import type { Database } from '@employee-management/database'

// Client-side Supabase client with enhanced error handling
export const createClientComponentClient = () => {
  try {
    // This will throw if environment variables are not properly configured
    const url = config.supabase.url
    const anonKey = config.supabase.anonKey

    // Validate configuration
    if (!url || url.includes('placeholder')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured. Please check your .env.local file.')
    }

    if (!anonKey || anonKey.includes('placeholder')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. Please check your .env.local file.')
    }

    // Check if URL is valid
    try {
      new URL(url)
    } catch (urlError) {
      throw new Error(`Invalid Supabase URL: ${url}. Please check your configuration.`)
    }

    console.log('🔧 Creating Supabase client with config:', {
      url,
      hasAnonKey: !!anonKey,
      anonKeyLength: anonKey?.length || 0,
      anonKeyPrefix: anonKey?.substring(0, 20) + '...'
    })

    // Create client with enhanced options for better network handling
    // Note: DO NOT set storage option - let @supabase/ssr handle cookies automatically
    return createBrowserClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-client-info': 'employee-management-system',
        },
      },
      // Add realtime options with better timeout handling
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    })
  } catch (error) {
    // More user-friendly error handling
    console.error('❌ Failed to create Supabase client:', error)

    if (error instanceof Error) {
      if (error.message.includes('Environment variable') ||
          error.message.includes('not configured') ||
          error.message.includes('Invalid Supabase URL')) {
        throw new Error(`Supabase configuration error: ${error.message}. Please ensure your .env.local file is properly configured and restart the development server.`)
      }
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