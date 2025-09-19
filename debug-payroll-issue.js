import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zbfoprhofddpqehklkji.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZm9wcmhvZmRkcHFlaGtsa2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1ODEzNjYsImV4cCI6MjA0MjE1NzM2Nn0.KpgKA8pMjFvGdtQxdQZObUqVFa6cJozW5w6ioHjHaTE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPayrollIssue() {
  console.log('🔍 Debugging Payroll Issue');
  console.log('==========================================');
  
  const cycleId = '9ffc2d4d-acf0-47f8-84b4-e1c4bf5d5e2a';
  
  try {
    // 1. Check payroll cycle
    console.log('\n📋 1. Checking payroll cycle:');
    const { data: cycle, error: cycleError } = await supabase
      .from('payroll_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();
    
    if (cycleError) {
      console.error('❌ Cycle Error:', cycleError);
    } else {
      console.log('✅ Cycle found:', {
        id: cycle.id,
        name: cycle.name,
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        status: cycle.status
      });
    }
    
    // 2. Check payroll details for this cycle
    console.log('\n💰 2. Checking payroll details:');
    const { data: details, error: detailsError } = await supabase
      .from('payroll_details')
      .select('*')
      .eq('payroll_cycle_id', cycleId);
    
    if (detailsError) {
      console.error('❌ Details Error:', detailsError);
    } else {
      console.log(`✅ Found ${details.length} payroll details:`, details);
    }
    
    // 3. Check employees with rates
    console.log('\n👥 3. Checking employees with rates:');
    const { data: employees, error: empError } = await supabase
      .from('users')
      .select('id, full_name, role, is_active, hourly_rate, daily_rate')
      .eq('role', 'employee')
      .eq('is_active', true);
    
    if (empError) {
      console.error('❌ Employee Error:', empError);
    } else {
      console.log(`✅ Found ${employees.length} active employees:`);
      employees.forEach(emp => {
        console.log(`  - ${emp.full_name}: hourly_rate=${emp.hourly_rate}, daily_rate=${emp.daily_rate}`);
      });
      
      // Filter employees with rates
      const employeesWithRates = employees.filter(emp => 
        emp.hourly_rate !== null || emp.daily_rate !== null
      );
      console.log(`📊 Employees with rates: ${employeesWithRates.length}`);
    }
    
    // 4. Check time entries for this period
    if (cycle) {
      console.log('\n⏰ 4. Checking time entries:');
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('user_id, check_in_time, check_out_time')
        .gte('check_in_time', cycle.start_date)
        .lte('check_in_time', cycle.end_date)
        .not('check_out_time', 'is', null);
      
      if (timeError) {
        console.error('❌ Time Entries Error:', timeError);
      } else {
        console.log(`✅ Found ${timeEntries.length} time entries in period`);
        
        // Group by user
        const entriesByUser = timeEntries.reduce((acc, entry) => {
          if (!acc[entry.user_id]) acc[entry.user_id] = 0;
          acc[entry.user_id]++;
          return acc;
        }, {});
        
        console.log('📊 Time entries by user:', entriesByUser);
      }
    }
    
    console.log('\n==========================================');
    console.log('🔍 Debug completed');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugPayrollIssue();