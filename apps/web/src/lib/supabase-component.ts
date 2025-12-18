import { createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@employee-management/database'
import { config } from '@employee-management/config'

// Recommended approach for Next.js App Router with SSR
export function createClient() {
  const cookieStore = cookies()

  return createBrowserClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}