// Database connection test for payroll system
// Run with: node test-db-connection.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔗 Testing Database Connection for Payroll System\n');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('payroll_cycles')
      .select('count(*)', { count: 'exact', head: true });
    
    if (tablesError) {
      console.error('❌ Basic connection failed:', tablesError);
      console.log('Supabase URL:', supabaseUrl);
      console.log('Anon Key present:', !!supabaseAnonKey);
      return;
    }
    console.log('✅ Basic connection successful');

    // Test 2: Check payroll_cycles table
    console.log('\n2. Testing payroll_cycles table...');
    const { data: cycles, error: cyclesError } = await supabase
      .from('payroll_cycles')
      .select('id, name, status, start_date, end_date')
      .limit(5);
    
    if (cyclesError) {
      console.error('❌ Payroll cycles query failed:', cyclesError.message);
    } else {
      console.log('✅ Payroll cycles table accessible');
      console.log(`   Found ${cycles.length} cycles:`, cycles);
    }

    // Test 3: Check users table with payroll-related fields
    console.log('\n3. Testing users table (employee data)...');
    const { data: employees, error: employeesError } = await supabase
      .from('users')
      .select('id, full_name, role, hourly_rate, daily_rate')
      .eq('role', 'employee')
      .limit(5);
    
    if (employeesError) {
      console.error('❌ Employees query failed:', employeesError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log(`   Found ${employees.length} employees:`, employees);
      
      // Check for missing rates
      const missingRates = employees.filter(emp => 
        emp.hourly_rate === null || emp.daily_rate === null
      );
      if (missingRates.length > 0) {
        console.log('⚠️  Employees with missing rates:', missingRates);
      }
    }

    // Test 4: Check payroll_details table
    console.log('\n4. Testing payroll_details table...');
    const { data: details, error: detailsError } = await supabase
      .from('payroll_details')
      .select('id, payroll_cycle_id, user_id, base_pay, net_pay')
      .limit(5);
    
    if (detailsError) {
      console.error('❌ Payroll details query failed:', detailsError.message);
    } else {
      console.log('✅ Payroll details table accessible');
      console.log(`   Found ${details.length} payroll records:`, details);
    }

    // Test 5: Check time_entries table
    console.log('\n5. Testing time_entries table...');
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('id, user_id, check_in_time, check_out_time')
      .not('check_out_time', 'is', null)
      .limit(5);
    
    if (timeError) {
      console.error('❌ Time entries query failed:', timeError.message);
    } else {
      console.log('✅ Time entries table accessible');
      console.log(`   Found ${timeEntries.length} completed time entries:`, timeEntries);
    }

    // Test 6: Test a complex join query (similar to payroll calculation)
    console.log('\n6. Testing complex join query...');
    const { data: joinData, error: joinError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        hourly_rate,
        daily_rate,
        time_entries!inner (
          check_in_time,
          check_out_time
        )
      `)
      .eq('role', 'employee')
      .not('hourly_rate', 'is', null)
      .not('daily_rate', 'is', null)
      .limit(3);
    
    if (joinError) {
      console.error('❌ Complex join query failed:', joinError.message);
    } else {
      console.log('✅ Complex join query successful');
      console.log(`   Found ${joinData.length} employees with time entries`);
    }

    console.log('\n✅ All database tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Payroll cycles: ${cycles?.length || 0}`);
    console.log(`   - Employees: ${employees?.length || 0}`);
    console.log(`   - Payroll details: ${details?.length || 0}`);
    console.log(`   - Time entries: ${timeEntries?.length || 0}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDatabaseConnection();