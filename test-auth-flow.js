// Test complete authentication flow
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nyhwnafkybuxneqiaffq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMjM1NjksImV4cCI6MjA3Mjc5OTU2OX0.sgFadGCoquAO9NqZ8bGxBYOFnPGBXkE_Xbo4A_iuznE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFullAuthFlow() {
  console.log('🧪 Testing full authentication flow...')
  console.log('')
  
  try {
    // Step 1: Login with admin credentials
    console.log('📝 Step 1: Logging in with admin@test.com...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'SecureAdmin2024!@#'
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      return
    }
    
    console.log('✅ Login successful!')
    console.log('   User ID:', loginData.user.id)
    console.log('   Email:', loginData.user.email)
    console.log('   User metadata:', loginData.user.user_metadata)
    console.log('')
    
    // Step 2: Get user profile from users table
    console.log('📝 Step 2: Fetching user profile from users table...')
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .maybeSingle()
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message)
      console.error('   This would cause the authentication error we saw!')
      return
    }
    
    if (!profileData) {
      console.error('❌ No profile found for user!')
      console.error('   This would cause the authentication error we saw!')
      return
    }
    
    console.log('✅ Profile fetch successful!')
    console.log('   Full name:', profileData.full_name)
    console.log('   Role:', profileData.role)
    console.log('   Branch ID:', profileData.branch_id)
    console.log('')
    
    // Step 3: Sign out
    console.log('📝 Step 3: Signing out...')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message)
      return
    }
    
    console.log('✅ Sign out successful!')
    console.log('')
    
    console.log('🎉 Full authentication flow test completed successfully!')
    console.log('   The error should be fixed now.')
    
  } catch (error) {
    console.error('💥 Unexpected error during auth flow test:', error)
  }
}

testFullAuthFlow()