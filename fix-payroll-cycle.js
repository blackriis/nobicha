// Fix payroll cycle issues
// Run with: node fix-payroll-cycle.js

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

async function fixPayrollCycle() {
  const cycleId = 'b4af0fd5-1633-45b6-a318-b61570666d9a';
  
  console.log('🔧 Fixing payroll cycle issues for:', cycleId);
  console.log('');

  try {
    // 1. Check current cycle status
    console.log('1. Checking cycle status...');
    const { data: cycle, error: cycleError } = await supabase
      .from('payroll_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();

    if (cycleError || !cycle) {
      console.error('❌ Cycle not found:', cycleError);
      return;
    }

    console.log(`Current cycle status: ${cycle.status}`);

    // 2. Check existing calculations
    console.log('\n2. Checking existing calculations...');
    const { data: existingCalcs, error: existingError } = await supabase
      .from('payroll_details')
      .select('id')
      .eq('payroll_cycle_id', cycleId);

    if (existingError) {
      console.error('❌ Error checking calculations:', existingError);
      return;
    }

    console.log(`Found ${existingCalcs?.length || 0} existing calculations`);

    // 3. Clear existing calculations if any
    if (existingCalcs && existingCalcs.length > 0) {
      console.log('\n3. Clearing existing calculations...');
      const { error: deleteError } = await supabase
        .from('payroll_details')
        .delete()
        .eq('payroll_cycle_id', cycleId);

      if (deleteError) {
        console.error('❌ Error deleting calculations:', deleteError);
        return;
      }
      console.log('✅ Cleared existing calculations');
    }

    // 4. Set cycle status to active if needed
    if (cycle.status !== 'active') {
      console.log('\n4. Setting cycle status to active...');
      const { error: updateError } = await supabase
        .from('payroll_cycles')
        .update({ status: 'active' })
        .eq('id', cycleId);

      if (updateError) {
        console.error('❌ Error updating cycle status:', updateError);
        return;
      }
      console.log('✅ Updated cycle status to active');
    }

    // 5. Verify employees have rates
    console.log('\n5. Checking employee rates...');
    const { data: employees, error: empError } = await supabase
      .from('users')
      .select('id, full_name, hourly_rate, daily_rate')
      .eq('role', 'employee');

    if (empError) {
      console.error('❌ Error checking employees:', empError);
      return;
    }

    const missingRates = employees.filter(emp => 
      !emp.hourly_rate || !emp.daily_rate
    );

    if (missingRates.length > 0) {
      console.log(`Found ${missingRates.length} employees with missing rates`);
      console.log('Updating rates...');
      
      for (let i = 0; i < missingRates.length; i++) {
        const emp = missingRates[i];
        const hourlyRate = 50 + (i * 10);
        const dailyRate = hourlyRate * 8;
        
        const { error: rateError } = await supabase
          .from('users')
          .update({
            hourly_rate: hourlyRate,
            daily_rate: dailyRate
          })
          .eq('id', emp.id);

        if (rateError) {
          console.error(`❌ Error updating ${emp.full_name}:`, rateError);
        } else {
          console.log(`✅ Updated ${emp.full_name}: ${hourlyRate}฿/hr, ${dailyRate}฿/day`);
        }
      }
    } else {
      console.log('✅ All employees have rates set');
    }

    console.log('\n🎉 Payroll cycle is now ready for calculation!');
    console.log('\nNext steps:');
    console.log('1. Try the payroll calculation again');
    console.log('2. If still fails, check browser console for detailed error message');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixPayrollCycle();