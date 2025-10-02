import { NextRequest, NextResponse } from 'next/server';
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { generalRateLimiter, createRateLimitResponse } from '@/lib/rate-limit';
import { auditService } from '@/lib/services/audit.service';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const { allowed, resetTime } = generalRateLimiter.checkLimit(request);
    if (!allowed) {
      return createRateLimitResponse(resetTime!);
    }

    const supabase = await createClient();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' }, 
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - ต้องเป็น Admin เท่านั้น' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, start_date, end_date } = body;

    // Validation
    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อรอบ วันที่เริ่มต้น วันที่สิ้นสุด' },
        { status: 400 }
      );
    }

    // Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด' },
        { status: 400 }
      );
    }

    // Check for overlapping payroll cycles
    const { data: existingCycles, error: overlapError } = await supabase
      .from('payroll_cycles')
      .select('id, cycle_name, start_date, end_date')
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (overlapError) {
      console.error('Error checking overlapping cycles:', overlapError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการตรวจสอบรอบที่ซ้ำซ้อน' },
        { status: 500 }
      );
    }

    if (existingCycles && existingCycles.length > 0) {
      return NextResponse.json(
        { 
          error: 'ช่วงวันที่ทับซ้อนกับรอบการจ่ายเงินเดือนที่มีอยู่แล้ว',
          conflicting_cycles: existingCycles
        },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const { data: nameCheck, error: nameError } = await supabase
      .from('payroll_cycles')
      .select('id')
      .eq('cycle_name', name)
      .single();

    if (nameError && nameError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking duplicate name:', nameError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการตรวจสอบชื่อรอบ' },
        { status: 500 }
      );
    }

    if (nameCheck) {
      return NextResponse.json(
        { error: 'ชื่อรอบการจ่ายเงินเดือนนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    // Create new payroll cycle
    const { data: newCycle, error: createError } = await supabase
      .from('payroll_cycles')
      .insert({
        cycle_name: name,
        start_date,
        end_date,
        pay_date: end_date, // Use end_date as default pay_date
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating payroll cycle:', createError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการสร้างรอบการจ่ายเงินเดือน' },
        { status: 500 }
      );
    }

    // Log audit event for payroll cycle creation
    await auditService.logPayrollCycleCreation(
      user.id,
      { name, start_date, end_date, status: 'active' },
      newCycle.id,
      request
    );

    return NextResponse.json({
      message: 'สร้างรอบการจ่ายเงินเดือนเรียบร้อยแล้ว',
      payroll_cycle: newCycle
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in payroll cycles POST:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
        // More specific error handling for auth session issues
        const errorMessage = authError?.message?.includes('Auth session missing') 
          ? 'Session หมดอายุ - กรุณาเข้าสู่ระบบใหม่'
          : 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ';
        
        console.error('Cookie authentication error:', {
          error: authError,
          message: authError?.message,
          code: authError?.code
        });
        
        return NextResponse.json(
          { 
            error: errorMessage,
            authError: true,
            needsLogin: true
          }, 
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

    // Verify admin role using service client
    const serviceSupabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - ต้องเป็น Admin เท่านั้น' }, 
        { status: 403 }
      );
    }

    // Fetch all payroll cycles ordered by created_at desc
    const { data: cycles, error: fetchError } = await serviceSupabase
      .from('payroll_cycles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching payroll cycles:', fetchError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรอบการจ่ายเงินเดือน' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payroll_cycles: cycles || []
    });

  } catch (error) {
    console.error('Unexpected error in payroll cycles GET:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
