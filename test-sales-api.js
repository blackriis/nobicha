const { createClient } = require('@supabase/supabase-js')

// Test script to check sales reports API
async function testSalesAPI() {
  console.log('🧪 Testing Sales Reports API...')
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nyhwnafkybuxneqiaffq.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyMzU2OSwiZXhwIjoyMDcyNzk5NTY5fQ.f4Rs24aT60heWzW07FM5K3h2yrZQhrm4fDih7M-rajM'
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('📊 Testing Supabase connection...')
  
  // Test 1: Check if users table exists and has data
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Users table error:', usersError)
    } else {
      console.log('✅ Users table accessible:', users?.length || 0, 'users found')
      if (users && users.length > 0) {
        console.log('👥 Sample users:', users)
      }
    }
  } catch (err) {
    console.error('❌ Users table test failed:', err)
  }
  
  // Test 2: Check authentication
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth session error:', authError)
    } else {
      console.log('🔑 Auth session:', session ? 'Active session found' : 'No active session')
    }
    
    // Try to sign in with test user
    console.log('🔐 Attempting test user login...')
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'employee@example.com',
      password: 'password123'
    })
    
    if (signInError) {
      console.error('❌ Sign in error:', signInError)
      
      // Try creating test user
      console.log('👤 Attempting to create test user...')
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'employee@example.com',
        password: 'password123'
      })
      
      if (signUpError) {
        console.error('❌ Sign up error:', signUpError)
      } else {
        console.log('✅ Test user created:', signUpData)
      }
    } else {
      console.log('✅ Test user authenticated:', authData.user?.id)
      
      // Now test the API endpoint
      console.log('🔍 Testing sales reports API...')
      const response = await fetch('http://localhost:3001/api/employee/sales-reports', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      console.log('📊 API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: result
      })
    }
    
  } catch (err) {
    console.error('❌ Authentication test failed:', err)
  }
}

// Run the test
testSalesAPI().catch(console.error)