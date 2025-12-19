import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { criticalRateLimiter, createRateLimitResponse } from '@/lib/rate-limit'
import { auditService } from '@/lib/services/audit.service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateLimitResult = criticalRateLimiter.isRateLimited(request)
    if (rateLimitResult.limited) {
      return createRateLimitResponse(rateLimitResult.resetTime!, criticalRateLimiter)
    }

    const supabase = await createClient()
    const { id: cycleId } = await params

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Create service client for reliable data access (bypasses RLS)
    const { createClient: createSimpleClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createSimpleClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Admin check - use service client to bypass RLS
    const { data: userProfile, error: profileError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - ต้องเป็น Admin เท่านั้น' },
        { status: 403 }
      )
    }

    // Get payroll cycle using service role client
    const { data: cycle, error: cycleError } = await serviceSupabase
      .from('payroll_cycles')
      .select('*')
      .eq('id', cycleId)
      .single()

    if (cycleError || !cycle) {
      console.error('Payroll cycle not found for finalize:', { cycleId, error: cycleError });
      return NextResponse.json(
        { error: 'ไม่พบรอบการจ่ายเงินเดือนที่ระบุ' },
        { status: 404 }
      )
    }

    // Check if already completed
    if (cycle.status === 'completed') {
      return NextResponse.json(
        { error: 'รอบการจ่ายเงินเดือนนี้ได้ถูกปิดแล้ว' },
        { status: 400 }
      )
    }

    // Check if cycle is active
    if (cycle.status !== 'active') {
      return NextResponse.json(
        { error: 'สามารถปิดรอบได้เฉพาะรอบที่มีสถานะ active เท่านั้น' },
        { status: 400 }
      )
    }

    // Get all payroll details for validation
    const { data: payrollDetails, error: detailsError } = await serviceSupabase
      .from('payroll_details')
      .select(`
        *,
        users!inner (
          id,
          full_name,
          employee_id
        )
      `)
      .eq('payroll_cycle_id', cycleId)

    if (detailsError) {
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลเงินเดือน' },
        { status: 500 }
      )
    }

    const details = payrollDetails || []

    // Validation: Check for negative net pay
    const employeesWithNegativeNetPay = details.filter(detail => detail.net_pay < 0)
    if (employeesWithNegativeNetPay.length > 0) {
      return NextResponse.json(
        { 
          error: 'ไม่สามารถปิดรอบได้ เนื่องจากมีพนักงานที่มีเงินเดือนสุทธิติดลบ',
          invalid_employees: employeesWithNegativeNetPay.map(detail => ({
            name: detail.users.full_name,
            employee_id: detail.users.employee_id,
            net_pay: detail.net_pay
          }))
        },
        { status: 400 }
      )
    }

    // Validation: Check for missing essential data
    const employeesWithMissingData = details.filter(detail => 
      !detail.users.full_name || 
      detail.base_pay === null || 
      detail.base_pay === undefined ||
      detail.net_pay === null ||
      detail.net_pay === undefined
    )
    
    if (employeesWithMissingData.length > 0) {
      return NextResponse.json(
        { 
          error: 'ไม่สามารถปิดรอบได้ เนื่องจากมีพนักงานที่ข้อมูลไม่ครบถ้วน',
          invalid_employees: employeesWithMissingData.map(detail => ({
            name: detail.users.full_name || 'Unknown',
            employee_id: detail.users.employee_id,
            missing_data: 'ข้อมูลค่าแรงหรือเงินเดือนสุทธิไม่ครบถ้วน'
          }))
        },
        { status: 400 }
      )
    }

    // Calculate totals for summary
    const totalEmployees = details.length
    const totalBasePay = details.reduce((sum, detail) => sum + (detail.base_pay || 0), 0)
    const totalOvertimePay = details.reduce((sum, detail) => sum + (detail.overtime_pay || 0), 0)
    const totalBonus = details.reduce((sum, detail) => sum + (detail.bonus || 0), 0)
    const totalDeduction = details.reduce((sum, detail) => sum + (detail.deduction || 0), 0)
    const totalNetPay = details.reduce((sum, detail) => sum + (detail.net_pay || 0), 0)

    // Finalize the cycle
    const finalizedAt = new Date().toISOString()
    
    console.log('🔄 Finalizing payroll cycle:', {
      cycleId,
      totalEmployees,
      totalNetPay,
      finalizedAt
    });
    
    const { data: finalizedCycle, error: finalizeError } = await serviceSupabase
      .from('payroll_cycles')
      .update({
        status: 'completed',
        finalized_at: finalizedAt,
        finalized_by: user.id,
        total_employees: totalEmployees,
        total_amount: totalNetPay
      })
      .eq('id', cycleId)
      .select('*')
      .single()

    if (finalizeError) {
      console.error('❌ Finalize error:', finalizeError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการปิดรอบการจ่ายเงินเดือน', details: finalizeError },
        { status: 500 }
      )
    }

    // Create audit log for finalization (optional - skip if table doesn't exist)
    let auditResult = true;
    try {
      auditResult = await auditService.log({
        userId: user.id,
        action: 'FINALIZE',
        tableName: 'payroll_cycles',
        recordId: cycleId,
        oldValues: {
          status: cycle.status,
          finalized_at: cycle.finalized_at,
          finalized_by: cycle.finalized_by,
          total_employees: cycle.total_employees,
          total_amount: cycle.total_amount
        },
        newValues: {
          status: 'completed',
          finalized_at: finalizedAt,
          finalized_by: user.id,
          total_employees: totalEmployees,
          total_amount: totalNetPay
        },
        description: `ปิดรอบการจ่ายเงินเดือน: ${cycle.cycle_name} (${totalEmployees} พนักงาน, รวม ${totalNetPay.toLocaleString('th-TH')} บาท)`,
        request
      });
    } catch (auditError) {
      console.warn('Audit logging failed (table may not exist):', auditError);
      auditResult = false;
    }

    // Create finalization summary
    const finalizationSummary = {
      cycle_info: {
        id: finalizedCycle.id,
        name: finalizedCycle.cycle_name,
        start_date: finalizedCycle.start_date,
        end_date: finalizedCycle.end_date,
        status: finalizedCycle.status,
        finalized_at: finalizedCycle.finalized_at,
        finalized_by: finalizedCycle.finalized_by,
        total_employees: finalizedCycle.total_employees,
        total_amount: finalizedCycle.total_amount
      },
      totals: {
        total_employees: totalEmployees,
        total_base_pay: totalBasePay,
        total_overtime_pay: totalOvertimePay,
        total_bonus: totalBonus,
        total_deduction: totalDeduction,
        total_net_pay: totalNetPay
      },
      finalization_details: {
        finalized_at: finalizedAt,
        finalized_by_user_id: user.id,
        validation_passed: true,
        audit_log_created: auditResult
      }
    }

    return NextResponse.json({
      message: `ปิดรอบการจ่ายเงินเดือน "${cycle.cycle_name}" เรียบร้อยแล้ว`,
      finalization_summary: finalizationSummary
    })

  } catch (error) {
    console.error('Payroll finalization error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการปิดรอบการจ่ายเงินเดือน' },
      { status: 500 }
    )
  }
}
