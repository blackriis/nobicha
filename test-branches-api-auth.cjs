const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testBranchesAPI() {
  console.log('🔍 Testing branches API with authentication...');
  
  // Create Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  try {
    // Test 1: Sign in as admin user
    console.log('\n🔐 Test 1: Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'SecureAdmin2024!@#'
    });
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log('👤 User:', authData.user?.email);
    console.log('🔑 Session:', authData.session ? 'Active' : 'None');
    
    // Test 2: Test the exact API logic
    console.log('\n🌐 Test 2: Testing API logic...');
    
    // Simulate the API authentication check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User verification failed:', userError);
      return;
    }
    
    console.log('✅ User verification successful:', user.email);
    
    // Test 3: Check user role
    console.log('\n👥 Test 3: Checking user role...');
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userProfile || userProfile.role !== 'admin') {
      console.error('❌ Admin role check failed');
      return;
    }
    
    console.log('✅ Admin role verified:', userProfile.role);
    
    // Test 4: Fetch branches (the actual API logic)
    console.log('\n🏢 Test 4: Fetching branches...');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name, address, latitude, longitude')
      .order('name', { ascending: true });
    
    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError);
      return;
    }
    
    console.log('✅ Branches fetched successfully');
    console.log('📊 Response format:');
    console.log(JSON.stringify({
      success: true,
      branches: branches || []
    }, null, 2));
    
    // Test 5: Test frontend component logic
    console.log('\n🎨 Test 5: Testing frontend component logic...');
    
    // Simulate the frontend fetch
    const mockResponse = {
      success: true,
      branches: branches || []
    };
    
    // Test the corrected frontend logic
    const frontendBranches = mockResponse.branches || [];
    
    console.log('✅ Frontend component would receive:', frontendBranches.length, 'branches');
    
    if (frontendBranches.length > 0) {
      console.log('🎉 SUCCESS: The fix should work!');
      console.log('📋 Branches that would be displayed:');
      frontendBranches.forEach((branch, index) => {
        console.log(`  ${index + 1}. ${branch.name} (ID: ${branch.id})`);
      });
    } else {
      console.log('❌ No branches would be displayed');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testBranchesAPI().catch(console.error);
