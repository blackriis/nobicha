import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@employee-management/database'
import { config } from '@employee-management/config'

// This is the recommended way to create a browser client for Next.js App Router
export function createSupabaseClient() {
  return createBrowserClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        flowType: 'pkce',
      },
    }
  )
}