const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testEmployeeAPI() {
  console.log('Testing Employee API with authentication...');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // First, let's check if we have any admin users
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: adminUsers, error: adminError } = await adminClient
      .from('users')
      .select('id, email, full_name, role')
      .eq('role', 'admin')
      .limit(1);
      
    console.log('Admin users found:', adminUsers?.length || 0);
    if (adminError) {
      console.log('Admin query error:', adminError);
    }
    
    if (adminUsers && adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      console.log('Admin user:', adminUser);
      
      // Try to sign in as admin (if we have email/password)
      // For now, let's just test the API directly with service role
      
      console.log('\\nTesting API endpoint directly...');
      
      const response = await fetch('http://localhost:3000/api/admin/reports/employees?dateRange=month', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      const result = await response.json();
      console.log('API Response status:', response.status);
      console.log('API Response:', result);
      
    } else {
      console.log('No admin users found. Creating test admin user...');
      
      // Create a test admin user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: 'admin@test.com',
        password: 'admin123456',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Admin',
          role: 'admin'
        }
      });
      
      if (createError) {
        console.log('Error creating admin user:', createError);
      } else {
        console.log('Created admin user:', newUser.user?.id);
        
        // Insert into users table
        const { error: insertError } = await adminClient
          .from('users')
          .insert({
            id: newUser.user.id,
            email: 'admin@test.com',
            full_name: 'Test Admin',
            employee_id: 'ADMIN001',
            role: 'admin'
          });
          
        if (insertError) {
          console.log('Error inserting user profile:', insertError);
        } else {
          console.log('Admin user profile created successfully');
        }
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testEmployeeAPI().catch(console.error);