import { NextRequest, NextResponse } from 'next/server';
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { generalRateLimiter, createRateLimitResponse } from '@/lib/rate-limit';
import { auditService } from '@/lib/services/audit.service';
import { config } from '@employee-management/config';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@employee-management/database';

interface PayrollCalculationResult {
  user_id: string;
  full_name: string;
  total_hours: number;
  total_days_worked: number;
  base_pay: number;
  calculation_method: 'hourly' | 'daily' | 'mixed';
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

function calculateHoursWorked(checkIn: string, checkOut: string): number {
  const checkInTime = new Date(checkIn);
  const checkOutTime = new Date(checkOut);
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  let cycleId = 'unknown'
  console.log('🚀 Payroll calculation request started:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method
  });
  
  try {
    // Rate limiting
    const { allowed, resetTime } = generalRateLimiter.checkLimit(request);
    if (!allowed) {
      return createRateLimitResponse(resetTime!);
    }

    // Get auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use bearer token authentication
      const token = authHeader.replace('Bearer ', '');
      const tempSupabase = await createSupabaseServerClient();
      
      const { data: userData, error: tokenError } = await tempSupabase.auth.getUser(token);
      if (tokenError || !userData.user) {
        console.error('Token authentication error:', tokenError);
        return NextResponse.json(
          { error: 'ไม่ได้รับอนุญาต - Token ไม่ถูกต้อง' }, 
          { status: 401 }
        );
      }
      user = userData.user;
    } else {
      // Fallback to cookie-based auth
      const supabase = await createClient();
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !cookieUser) {
        console.error('Cookie authentication error:', authError);
        return NextResponse.json(
          { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' }, 
          { status: 401 }
        );
      }
      user = cookieUser;
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' }, 
        { status: 401 }
      );
    }

    // Create simple service client without cookies for admin operations
    const { createClient: createSimpleClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createSimpleClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify admin role using service role client for reliable access
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      console.error('Admin verification failed:', { userError, userData });
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - ต้องเป็น Admin เท่านั้น' }, 
        { status: 403 }
      );
    }

    const { id } = await context.params;
    cycleId = id;
    
    console.log('📋 Processing payroll calculation for cycle:', {
      cycle_id: id,
      timestamp: new Date().toISOString()
    });

    // Validate payroll cycle exists and is active (using service role)
    const { data: cycle, error: cycleError } = await serviceSupabase
      .from('payroll_cycles')
      .select('*')
      .eq('id', id)
      .single();

    if (cycleError || !cycle) {
      return NextResponse.json(
        { error: 'ไม่พบรอบการจ่ายเงินเดือนที่ระบุ' },
        { status: 404 }
      );
    }

    if (cycle.status !== 'active') {
      console.error('Payroll cycle status error:', {
        cycle_id: id,
        current_status: cycle.status,
        expected_status: 'active'
      });
      return NextResponse.json(
        { error: `รอบการจ่ายเงินเดือนนี้ไม่สามารถคำนวณได้ - สถานะปัจจุบัน: ${cycle.status} (ต้องเป็น active)` },
        { status: 400 }
      );
    }

    // Check if calculations already exist for this cycle (using service role)
    const { data: existingCalculations, error: existingError } = await serviceSupabase
      .from('payroll_details')
      .select('id')
      .eq('payroll_cycle_id', id)
      .limit(1);

    if (existingError) {
      console.error('Error checking existing calculations:', existingError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการตรวจสอบการคำนวณที่มีอยู่' },
        { status: 500 }
      );
    }

    if (existingCalculations && existingCalculations.length > 0) {
      console.error('Payroll calculation already exists:', {
        cycle_id: id,
        existing_calculations_count: existingCalculations.length
      });
      return NextResponse.json(
        { error: 'การคำนวณเงินเดือนสำหรับรอบนี้ได้ทำไปแล้ว' },
        { status: 400 }
      );
    }

    // Get all employees with their rates (using service role for reliable access)
    // Allow employees with either hourly_rate OR daily_rate (not both required)
    const { data: employees, error: employeeError } = await serviceSupabase
      .from('users')
      .select('id, full_name, hourly_rate, daily_rate')
      .eq('role', 'employee')
      .eq('is_active', true)
      .or('hourly_rate.not.is.null,daily_rate.not.is.null');

    if (employeeError) {
      console.error('Error fetching employees:', employeeError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน' },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      console.error('No eligible employees found:', {
        cycle_id: id,
        employees_count: employees?.length || 0,
        query_criteria: 'role=employee AND is_active=true AND (hourly_rate IS NOT NULL OR daily_rate IS NOT NULL)'
      });

      // Check if we're using placeholder configuration
      if (config.isPlaceholder) {
        return NextResponse.json(
          { 
            error: '🚧 ระบบใช้ข้อมูลจำลอง - ไม่สามารถคำนวณเงินเดือนได้',
            details: 'กรุณาตั้งค่า Supabase ให้ถูกต้องใน .env.local และเพิ่มข้อมูลพนักงานที่มี hourly_rate และ daily_rate',
            suggestion: 'ดูวิธีการตั้งค่าใน SETUP_DATABASE_CONNECTION.md'
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          error: 'ไม่พบพนักงานที่มีข้อมูลค่าแรงสำหรับการคำนวณ',
          details: 'ต้องมีพนักงานที่มี hourly_rate หรือ daily_rate ตั้งค่าไว้',
          suggestion: 'กรุณาเพิ่มข้อมูลค่าแรงให้พนักงานใน admin panel หรือรัน migration เพื่อเพิ่ม rate fields'
        },
        { status: 400 }
      );
    }

    // Get time entries for the payroll period (using service role)
    const { data: timeEntries, error: timeError } = await serviceSupabase
      .from('time_entries')
      .select('user_id, check_in_time, check_out_time')
      .gte('check_in_time', cycle.start_date)
      .lte('check_in_time', cycle.end_date)
      .not('check_out_time', 'is', null);

    if (timeError) {
      console.error('Error fetching time entries:', timeError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเวลาทำงาน' },
        { status: 500 }
      );
    }

    // Calculate payroll for each employee
    const calculations: PayrollCalculationResult[] = [];
    const payrollDetails = [];

    for (const employee of employees) {
      // Get employee's time entries
      const employeeTimeEntries = timeEntries?.filter(
        entry => entry.user_id === employee.id
      ) || [];

      let totalHours = 0;
      let totalDaysWorked = 0;
      let basePay = 0;
      let calculationMethod: 'hourly' | 'daily' | 'mixed' = 'hourly';

      // Group time entries by date
      const entriesByDate = employeeTimeEntries.reduce((acc, entry) => {
        const date = entry.check_in_time.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
      }, {} as Record<string, typeof employeeTimeEntries>);

      // Calculate for each working day
      const dailyCalculations = [];
      for (const [date, dayEntries] of Object.entries(entriesByDate)) {
        let dayHours = 0;
        for (const entry of dayEntries) {
          if (entry.check_out_time) {
            dayHours += calculateHoursWorked(entry.check_in_time, entry.check_out_time);
          }
        }

        totalHours += dayHours;
        totalDaysWorked += 1;

        // Apply business rule with fallbacks for missing rates
        if (dayHours > 12 && employee.daily_rate) {
          // Use daily rate if available and hours > 12
          basePay += parseFloat(employee.daily_rate.toString());
          dailyCalculations.push({ date, hours: dayHours, method: 'daily', pay: parseFloat(employee.daily_rate.toString()) });
        } else if (employee.hourly_rate) {
          // Use hourly rate if available
          const dayPay = dayHours * parseFloat(employee.hourly_rate.toString());
          basePay += dayPay;
          dailyCalculations.push({ date, hours: dayHours, method: 'hourly', pay: dayPay });
        } else if (employee.daily_rate) {
          // Fallback to daily rate if only daily rate is available
          basePay += parseFloat(employee.daily_rate.toString());
          dailyCalculations.push({ date, hours: dayHours, method: 'daily', pay: parseFloat(employee.daily_rate.toString()) });
        } else {
          // This shouldn't happen due to our query filter, but just in case
          console.warn(`No rate found for employee ${employee.full_name} (${employee.id})`);
          dailyCalculations.push({ date, hours: dayHours, method: 'hourly', pay: 0 });
        }
      }

      // Determine overall calculation method
      const dailyMethods = dailyCalculations.map(d => d.method);
      if (dailyMethods.every(m => m === 'daily')) {
        calculationMethod = 'daily';
      } else if (dailyMethods.every(m => m === 'hourly')) {
        calculationMethod = 'hourly';
      } else {
        calculationMethod = 'mixed';
      }

      calculations.push({
        user_id: employee.id,
        full_name: employee.full_name,
        total_hours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
        total_days_worked: totalDaysWorked,
        base_pay: Math.round(basePay * 100) / 100, // Round to 2 decimal places
        calculation_method: calculationMethod
      });

      // Prepare payroll detail record
      payrollDetails.push({
        payroll_cycle_id: id,
        user_id: employee.id,
        base_pay: Math.round(basePay * 100) / 100,
        bonus: 0,
        deduction: 0,
        net_pay: Math.round(basePay * 100) / 100 // For now, net_pay = base_pay (no bonus/deduction yet)
      });
    }

    // Insert payroll details (using service role)
    const { error: insertError } = await serviceSupabase
      .from('payroll_details')
      .insert(payrollDetails);

    if (insertError) {
      console.error('Error inserting payroll details:', insertError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการบันทึกผลการคำนวณ' },
        { status: 500 }
      );
    }

    const calculationSummary = {
      total_employees: calculations.length,
      total_base_pay: calculations.reduce((sum, calc) => sum + calc.base_pay, 0),
      calculation_period: {
        start_date: cycle.start_date,
        end_date: cycle.end_date
      }
    };

    // Log audit events for payroll calculation (non-blocking)
    try {
      await auditService.logPayrollCalculation(
        user.id,
        id,
        calculationSummary,
        request
      );

      await auditService.logPayrollDetailCreation(
        user.id,
        payrollDetails,
        id,
        request
      );
    } catch (auditError) {
      console.error('Audit logging failed (non-blocking):', auditError);
      // Continue with response - audit failure shouldn't block payroll calculation
    }

    return NextResponse.json({
      message: 'คำนวณเงินเดือนเรียบร้อยแล้ว',
      payroll_cycle: cycle,
      calculation_summary: calculationSummary,
      employee_calculations: calculations
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in payroll calculation:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      cycle_id: cycleId,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
        details: error instanceof Error ? error.message : 'Unknown error',
        cycle_id: cycleId
      },
      { status: 500 }
    );
  }
}
