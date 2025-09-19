// Test admin authentication and session
// Run with: node test-admin-auth.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminAuth() {
  console.log('🔐 Testing Admin Authentication...\n');

  try {
    // 1. List all admin users
    console.log('1. Checking admin users...');
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error fetching admins:', adminError);
      return;
    }

    console.log(`Found ${admins.length} admin users:`);
    admins.forEach(admin => {
      console.log(`  - ${admin.full_name} (${admin.email}) - Active: ${admin.is_active}`);
    });

    // 2. Check RLS policies for users table
    console.log('\n2. Checking RLS policies for users table...');
    const { data: userPolicies, error: userPolicyError } = await supabase
      .rpc('get_policies', { table_name: 'users' });

    if (userPolicyError) {
      console.error('❌ Error checking user policies:', userPolicyError);
    } else {
      console.log('User table policies:', userPolicies?.length || 0);
    }

    // 3. Check RLS policies for payroll_details table
    console.log('\n3. Checking RLS policies for payroll_details table...');
    const { data: payrollPolicies, error: payrollPolicyError } = await supabase
      .rpc('get_policies', { table_name: 'payroll_details' });

    if (payrollPolicyError) {
      console.error('❌ Error checking payroll policies:', payrollPolicyError);
    } else {
      console.log('Payroll_details table policies:', payrollPolicies?.length || 0);
    }

    // 4. Test direct access to employee data
    console.log('\n4. Testing direct access to employee hourly/daily rates...');
    const { data: employeeRates, error: rateError } = await supabase
      .from('users')
      .select('id, full_name, hourly_rate, daily_rate')
      .eq('role', 'employee')
      .limit(3);

    if (rateError) {
      console.error('❌ Error accessing employee rates:', rateError);
    } else {
      console.log(`✅ Successfully accessed ${employeeRates.length} employee rates`);
      employeeRates.forEach(emp => {
        console.log(`  - ${emp.full_name}: ${emp.hourly_rate}฿/hr, ${emp.daily_rate}฿/day`);
      });
    }

    // 5. Test payroll_details table access
    console.log('\n5. Testing payroll_details table access...');
    const { data: payrollData, error: payrollError } = await supabase
      .from('payroll_details')
      .select('id, user_id, base_pay')
      .limit(5);

    if (payrollError) {
      console.error('❌ Error accessing payroll_details:', payrollError);
    } else {
      console.log(`✅ Successfully accessed payroll_details: ${payrollData.length} records`);
    }

    console.log('\n📋 Summary:');
    console.log('- If using service role: All queries should work');
    console.log('- If using session auth: Check that RLS policies allow admin access');
    console.log('- For payroll calculation, recommend using service role for data operations');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminAuth();