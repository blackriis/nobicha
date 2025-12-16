import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { config } from '@employee-management/config'
import { cookies } from 'next/headers'
import type { Database } from '@employee-management/database'

// Server client for API routes - proper SSR client that handles cookies
export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Server client with service role for bypassing RLS (admin operations)
// Uses @supabase/supabase-js directly (not SSR) to properly bypass RLS
// Supports both sync and async usage for backward compatibility
export const createSupabaseServerClient = (): ReturnType<typeof createSupabaseClient<Database>> => {
  // Check if service role key is available
  const serviceRoleKey = config.supabase.serviceRoleKey
  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set! Admin operations will fail due to RLS.')
    console.error('Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file.')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  // Use @supabase/supabase-js directly for service role (bypasses RLS)
  return createSupabaseClient<Database>(
    config.supabase.url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Async wrapper for backward compatibility (can be removed after all files are updated)
export const createSupabaseServerClientAsync = async () => {
  return createSupabaseServerClient()
}
