import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔗 Testing Payroll Database Connection...');
    
    const supabase = await createClient();
    
    // Test 1: Basic connection with auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth test:', { hasUser: !!user, authError });
    
    // Test 2: Check payroll_cycles table (anonymous access)
    console.log('Testing payroll_cycles table...');
    const { data: cycles, error: cyclesError } = await supabase
      .from('payroll_cycles')
      .select('*')
      .limit(5);
    
    console.log('Cycles result:', { cycles, cyclesError });

    // Test 3: Check users table
    console.log('Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, role, hourly_rate, daily_rate')
      .eq('role', 'employee')
      .limit(5);
    
    console.log('Users result:', { users, usersError });

    // Test 4: Check payroll_details table
    console.log('Testing payroll_details table...');
    const { data: details, error: detailsError } = await supabase
      .from('payroll_details')
      .select('*')
      .limit(5);
    
    console.log('Details result:', { details, detailsError });

    // Test 5: Check time_entries table
    console.log('Testing time_entries table...');
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('id, user_id, check_in_time, check_out_time')
      .not('check_out_time', 'is', null)
      .limit(5);
    
    console.log('Time entries result:', { timeEntries, timeError });

    // Compile summary
    const summary = {
      connection_test: 'successful',
      auth_status: authError ? 'failed' : 'no_user_context',
      tables: {
        payroll_cycles: {
          accessible: !cyclesError,
          count: cycles?.length || 0,
          error: cyclesError?.message || null
        },
        users: {
          accessible: !usersError,
          employees_count: users?.length || 0,
          employees_with_rates: users?.filter(u => u.hourly_rate && u.daily_rate).length || 0,
          error: usersError?.message || null
        },
        payroll_details: {
          accessible: !detailsError,
          count: details?.length || 0,
          error: detailsError?.message || null
        },
        time_entries: {
          accessible: !timeError,
          count: timeEntries?.length || 0,
          error: timeError?.message || null
        }
      },
      sample_data: {
        cycles: cycles || [],
        employees: users || [],
        recent_details: details || [],
        recent_time_entries: timeEntries || []
      }
    };

    return NextResponse.json({
      message: 'Database connection test completed',
      timestamp: new Date().toISOString(),
      summary
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}