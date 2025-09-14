const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

console.log('🔧 Environment check:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Missing');
console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n🔍 === DATABASE SCHEMA ANALYSIS ===');
  
  // Check all users
  console.log('\n📊 Checking all users in database...');
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, branch_id, employee_id, created_at')
    .order('created_at');
  
  if (error) {
    console.error('❌ Users Error:', error.message);
    return;
  }
  
  console.log(`Found ${users?.length || 0} users:`);
  users?.forEach((user, i) => {
    console.log(`${i+1}. ${user.email} (${user.full_name})`);
    console.log(`   - Role: ${user.role}`); 
    console.log(`   - Branch ID: ${user.branch_id || 'None'}`);
    console.log(`   - Employee ID: ${user.employee_id || 'None'}`);
    console.log(`   - Created: ${user.created_at}\n`);
  });
  
  // Check all branches  
  console.log('🏢 Checking branches...');
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('id, name, address')
    .order('name');
  
  if (branchError) {
    console.error('❌ Branch Error:', branchError.message);
    return;
  }
  
  console.log(`Found ${branches?.length || 0} branches:`);
  branches?.forEach((branch, i) => {
    console.log(`${i+1}. ${branch.name}`);
    console.log(`   - ID: ${branch.id}`);
    console.log(`   - Address: ${branch.address}\n`);
  });
  
  // Check user-branch relationships
  console.log('🔗 Analyzing User-Branch Relationships...');
  const employeeUsers = users?.filter(u => u.role === 'employee') || [];
  
  employeeUsers.forEach(emp => {
    const branch = branches?.find(b => b.id === emp.branch_id);
    console.log(`👤 ${emp.full_name} (${emp.email})`);
    console.log(`   - Employee ID: ${emp.employee_id || 'MISSING'}`);
    console.log(`   - Assigned Branch: ${branch ? branch.name : 'NO BRANCH ASSIGNED'}`);
    console.log(`   - Branch ID: ${emp.branch_id || 'NULL'}\n`);
  });
  
  // Check time entries structure
  console.log('⏰ Checking time_entries schema...');
  const { data: timeEntries, error: timeError } = await supabase
    .from('time_entries')
    .select('*')
    .limit(1);
  
  if (timeError) {
    console.error('❌ Time Entries Error:', timeError.message);
  } else {
    console.log('Time entries table structure:');
    if (timeEntries && timeEntries.length > 0) {
      console.log('Sample record keys:', Object.keys(timeEntries[0]));
    } else {
      console.log('No time entries found (empty table)');
    }
  }
  
  console.log('\n🎯 === PROBLEM ANALYSIS ===');
  
  // Analyze problems
  const problems = [];
  
  // Check if employee.som@test.com exists and has branch
  const testEmployee = users?.find(u => u.email === 'employee.som@test.com');
  if (!testEmployee) {
    problems.push('❌ Test employee (employee.som@test.com) not found in users table');
  } else {
    console.log(`✅ Test employee found: ${testEmployee.full_name}`);
    if (!testEmployee.branch_id) {
      problems.push(`❌ Test employee (${testEmployee.email}) has no branch_id assigned`);
    } else {
      const assignedBranch = branches?.find(b => b.id === testEmployee.branch_id);
      if (assignedBranch) {
        console.log(`✅ Test employee assigned to branch: ${assignedBranch.name}`);
      } else {
        problems.push(`❌ Test employee branch_id (${testEmployee.branch_id}) does not exist in branches table`);
      }
    }
    
    if (!testEmployee.employee_id) {
      problems.push(`❌ Test employee (${testEmployee.email}) has no employee_id`);
    } else {
      console.log(`✅ Test employee has employee_id: ${testEmployee.employee_id}`);
    }
  }
  
  // Check if branches exist
  if (!branches || branches.length === 0) {
    problems.push('❌ No branches found in database');
  } else {
    console.log(`✅ ${branches.length} branches found`);
  }
  
  // Summary
  console.log('\n📋 === SUMMARY ===');
  if (problems.length === 0) {
    console.log('✅ No critical database schema problems detected');
  } else {
    console.log(`❌ Found ${problems.length} problems:`);
    problems.forEach((problem, i) => {
      console.log(`${i+1}. ${problem}`);
    });
  }
})();