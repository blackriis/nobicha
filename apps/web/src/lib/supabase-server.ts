import { createServerClient } from '@supabase/ssr'
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
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    config.supabase.url,
    config.supabase.serviceRoleKey || config.supabase.anonKey,
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
