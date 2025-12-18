import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@employee-management/database'
import { config } from '@employee-management/config'

// Keep singleton but ensure it's created only once and properly configured
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const getBrowserClient = () => {
  if (!browserClient) {
    console.log('Creating new Supabase browser client...')
    browserClient = createBrowserClient<Database>(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            'x-client-info': 'employee-management-system',
          },
        },
      }
    )
  }
  return browserClient
}