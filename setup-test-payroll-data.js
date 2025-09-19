// Setup test data for payroll system
// Run with: node setup-test-payroll-data.js

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

async function setupTestData() {
  console.log('🚀 Setting up test data for payroll system...\n');

  try {
    // 1. Check existing employees
    console.log('1. Checking existing employees...');
    const { data: existingEmployees, error: checkError } = await supabase
      .from('users')
      .select('id, full_name, role, hourly_rate, daily_rate')
      .eq('role', 'employee');

    if (checkError) {
      console.error('Error checking employees:', checkError);
      return;
    }

    console.log(`Found ${existingEmployees.length} existing employees`);

    // 2. Update existing employees with rates
    if (existingEmployees.length > 0) {
      console.log('\n2. Updating existing employees with payroll rates...');
      
      for (let i = 0; i < existingEmployees.length; i++) {
        const employee = existingEmployees[i];
        const hourlyRate = 50 + (i * 10); // 50, 60, 70 บาท/ชม.
        const dailyRate = hourlyRate * 8; // 8 ชั่วโมง/วัน
        
        const { error: updateError } = await supabase
          .from('users')
          .update({
            hourly_rate: hourlyRate,
            daily_rate: dailyRate
          })
          .eq('id', employee.id);

        if (updateError) {
          console.error(`Error updating ${employee.full_name}:`, updateError);
        } else {
          console.log(`✅ Updated ${employee.full_name}: ${hourlyRate}฿/hr, ${dailyRate}฿/day`);
        }
      }
    } else {
      // 3. Create test employees if none exist
      console.log('\n2. Creating test employees...');
      
      const testEmployees = [
        {
          email: 'emp1@test.com',
          full_name: 'นายทดสอบ หนึ่ง',
          role: 'employee',
          employee_id: 'EMP001',
          hourly_rate: 50,
          daily_rate: 400,
          phone_number: '0812345678',
          hire_date: '2024-01-01',
          is_active: true
        },
        {
          email: 'emp2@test.com',
          full_name: 'นางสาวทดสอบ สอง',
          role: 'employee',
          employee_id: 'EMP002',
          hourly_rate: 60,
          daily_rate: 480,
          phone_number: '0823456789',
          hire_date: '2024-02-01',
          is_active: true
        },
        {
          email: 'emp3@test.com',
          full_name: 'นายทดสอบ สาม',
          role: 'employee',
          employee_id: 'EMP003',
          hourly_rate: 70,
          daily_rate: 560,
          phone_number: '0834567890',
          hire_date: '2024-03-01',
          is_active: true
        }
      ];

      for (const employee of testEmployees) {
        const { error } = await supabase
          .from('users')
          .insert(employee);

        if (error) {
          console.error(`Error creating ${employee.full_name}:`, error);
        } else {
          console.log(`✅ Created employee: ${employee.full_name}`);
        }
      }
    }

    // 4. Create test time entries for current payroll cycle
    console.log('\n3. Creating test time entries...');
    
    const { data: employees } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'employee')
      .not('hourly_rate', 'is', null);

    if (employees && employees.length > 0) {
      const currentCycleId = 'd18c820a-8bff-4d65-bb71-9fc66800b601';
      const startDate = new Date('2025-09-18');
      const today = new Date();
      
      for (const employee of employees) {
        // Create entries for past few days
        for (let i = 0; i < 3; i++) {
          const workDate = new Date(startDate);
          workDate.setDate(startDate.getDate() + i);
          
          if (workDate <= today) {
            const checkInTime = new Date(workDate);
            checkInTime.setHours(8, 0, 0, 0); // 8:00 AM
            
            const checkOutTime = new Date(workDate);
            checkOutTime.setHours(17, 0, 0, 0); // 5:00 PM
            
            const { error } = await supabase
              .from('time_entries')
              .insert({
                user_id: employee.id,
                branch_id: '00000000-0000-0000-0000-000000000001', // Default branch
                check_in_time: checkInTime.toISOString(),
                check_out_time: checkOutTime.toISOString(),
                break_duration: 60, // 1 hour break
                total_hours: 8,
                created_at: checkInTime.toISOString()
              });

            if (error) {
              console.error(`Error creating time entry for ${employee.full_name}:`, error);
            } else {
              console.log(`✅ Created time entry for ${employee.full_name} on ${workDate.toDateString()}`);
            }
          }
        }
      }
    }

    console.log('\n🎉 Test data setup completed!');
    console.log('\nNext steps:');
    console.log('1. Try the payroll calculation again');
    console.log('2. Check the enhanced error logs');
    console.log('3. Verify employees have rates set');

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupTestData();