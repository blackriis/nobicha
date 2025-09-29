const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAdminBranches() {
  console.log('🔍 Testing admin branches functionality...');
  
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
    // Test 1: Check if branches exist
    console.log('\n📋 Test 1: Checking branches in database...');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name, address, latitude, longitude')
      .order('name', { ascending: true });
      
    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError);
      return;
    }
    
    console.log('✅ Branches found:', branches?.length || 0);
    if (branches && branches.length > 0) {
      console.log('📋 Branch list:');
      branches.forEach((branch, index) => {
        console.log(`  ${index + 1}. ${branch.name} (ID: ${branch.id})`);
      });
    }
    
    // Test 2: Check admin users
    console.log('\n👤 Test 2: Checking admin users...');
    const { data: adminUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('role', 'admin');
      
    if (usersError) {
      console.error('❌ Error fetching admin users:', usersError);
      return;
    }
    
    console.log('✅ Admin users found:', adminUsers?.length || 0);
    if (adminUsers && adminUsers.length > 0) {
      console.log('📋 Admin users:');
      adminUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.full_name})`);
      });
    }
    
    // Test 3: Simulate API call that would be made by the frontend
    console.log('\n🌐 Test 3: Simulating API call...');
    
    // Get first admin user
    const adminUser = adminUsers?.[0];
    if (!adminUser) {
      console.error('❌ No admin user found');
      return;
    }
    
    console.log(`Using admin user: ${adminUser.email}`);
    
    // Test the exact query that the API uses
    const { data: apiBranches, error: apiError } = await supabase
      .from('branches')
      .select('id, name, address, latitude, longitude')
      .order('name', { ascending: true });
      
    if (apiError) {
      console.error('❌ API simulation error:', apiError);
      return;
    }
    
    console.log('✅ API simulation successful');
    console.log('📊 API Response format:');
    console.log(JSON.stringify({
      success: true,
      branches: apiBranches || []
    }, null, 2));
    
    // Test 4: Check if the issue might be in the frontend component
    console.log('\n🔧 Test 4: Analyzing potential issues...');
    
    if (branches && branches.length > 0) {
      console.log('✅ Database has branches data');
      console.log('✅ API query works correctly');
      console.log('🔍 Possible issues:');
      console.log('  1. Authentication not working properly');
      console.log('  2. Frontend component not handling response correctly');
      console.log('  3. CORS or cookie issues');
      console.log('  4. Rate limiting blocking requests');
    } else {
      console.log('❌ No branches found - this is the root cause');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAdminBranches().catch(console.error);
