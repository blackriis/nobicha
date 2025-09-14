// Test login flow with admin user
const { createBrowserClient } = require('@supabase/ssr')

const supabaseUrl = 'https://nyhwnafkybuxneqiaffq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMjM1NjksImV4cCI6MjA3Mjc5OTU2OX0.sgFadGCoquAO9NqZ8bGxBYOFnPGBXkE_Xbo4A_iuznE'

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('Testing login flow...')
  
  try {
    // Try to sign in with test admin user
    // Note: We need to check what the actual password is
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123' // Common test password
    })
    
    if (error) {
      console.error('Login failed:', error.message)
      // Try with different password
      console.log('Trying with different password...')
      const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'password123'
      })
      
      if (error2) {
        console.error('Login failed again:', error2.message)
        console.log('We need to reset/set the password for this user')
        return
      }
      
      console.log('✅ Login successful with password123!')
      console.log('User data:', data2.user)
    } else {
      console.log('✅ Login successful with admin123!')
      console.log('User data:', data.user)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testLogin()