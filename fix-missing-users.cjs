const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingUsers() {
  console.log('🔧 Adding missing users...');
  
  const missingUsers = [
    {
      id: '31f7de7a-68a7-4fbd-bacb-13accffe476a',
      email: 'employee.nina@test.com',
      full_name: 'นิน่า สวยงาม',
      role: 'employee',
      branch_id: '00000000-0000-0000-0000-000000000003',
      employee_id: 'EMP004',
      phone_number: '021234571',
      hire_date: '2025-09-01',
      is_active: true,
      hourly_rate: 50
    },
    {
      id: '585572b8-4552-4de9-8bb0-00aba3273fc0',
      email: 'employee.som@test.com',
      full_name: 'สมใจ ใจดี',
      role: 'employee',
      branch_id: '00000000-0000-0000-0000-000000000003',
      employee_id: 'EMP001',
      phone_number: '021234569',
      hire_date: '2025-09-01',
      is_active: true,
      hourly_rate: 50
    },
    {
      id: 'de2171b8-a5bf-421e-abd7-fd1c551284c8',
      email: 'employee.malee@test.com',
      full_name: 'มาลี ดีใจ',
      role: 'employee',
      branch_id: '00000000-0000-0000-0000-000000000003',
      employee_id: 'EMP002',
      phone_number: '021234570',
      hire_date: '2025-09-01',
      is_active: true,
      hourly_rate: 50
    },
    {
      id: 'b5917cd9-bd48-4715-be70-5fdf0cca0764',
      email: 'employee.chai@test.com',
      full_name: 'ชาย กล้าหาญ',
      role: 'employee',
      branch_id: '00000000-0000-0000-0000-000000000003',
      employee_id: 'EMP003',
      phone_number: '021234572',
      hire_date: '2025-09-01',
      is_active: true,
      hourly_rate: 50
    }
  ];

  try {
    // Insert missing users
    const { data, error } = await supabase
      .from('users')
      .insert(missingUsers);

    if (error) {
      console.error('❌ Error inserting users:', error);
      return;
    }

    console.log('✅ Successfully added missing users!');
    console.log('📊 Added users:', missingUsers.length);

    // Verify the fix
    console.log('🔍 Verifying fix...');
    const { data: allUsers, error: verifyError } = await supabase
      .from('users')
      .select('id, full_name, employee_id, role');

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      return;
    }

    console.log('✅ Total users now:', allUsers?.length || 0);
    allUsers?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.employee_id}) - ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixMissingUsers().catch(console.error);