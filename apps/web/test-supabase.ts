// Simple Supabase connection test
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nyhwnafkybuxneqiaffq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMjM1NjksImV4cCI6MjA3Mjc5OTU2OX0.sgFadGCoquAO9NqZ8bGxBYOFnPGBXkE_Xbo4A_iuznE'

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

async function testConnection(): Promise<void> {
  console.log('Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseAnonKey.substring(0, 50) + '...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.error('Connection error:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    } else {
      console.log('✅ Connection successful!')
      console.log('Response:', data)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testConnection()