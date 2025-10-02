import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { importantRateLimiter, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateLimitResult = importantRateLimiter.isRateLimited(request)
    if (rateLimitResult.limited) {
      return createRateLimitResponse(rateLimitResult.resetTime!, importantRateLimiter)
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

    // Admin check
    const { data: userProfile, error: profileError } = await supabase
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

    // Get payroll cycle with status check
    const { data: cycle, error: cycleError } = await supabase
      .from('payroll_cycles')
      .select('*')
      .eq('id', cycleId)
      .single()

    if (cycleError || !cycle) {
      return NextResponse.json(
        { error: 'ไม่พบรอบการจ่ายเงินเดือนที่ระบุ' },
        { status: 404 }
      )
    }

    // Create service client for reliable data access
    const { createClient: createSimpleClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createSimpleClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get payroll details with employee information
    console.log('🔍 Getting payroll details for cycle:', cycleId);
    const { data: payrollDetails, error: detailsError } = await serviceSupabase
      .from('payroll_details')
      .select(`
        *,
        users!inner (
          id,
          full_name,
          employee_id,
          branches (
            id,
            name
          )
        )
      `)
      .eq('payroll_cycle_id', cycleId)
      .order('created_at', { ascending: true })
    
    console.log('📊 Payroll details query result:', {
      error: detailsError,
      count: payrollDetails?.length || 0,
      data: payrollDetails
    });

    if (detailsError) {
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดเงินเดือน' },
        { status: 500 }
      )
    }

    const details = payrollDetails || []

    // Calculate totals and statistics
    const totalEmployees = details.length
    const totalBasePay = details.reduce((sum, detail) => sum + (detail.base_pay || 0), 0)
    const totalOvertimePay = details.reduce((sum, detail) => sum + (detail.overtime_pay || 0), 0)
    const totalBonus = details.reduce((sum, detail) => sum + (detail.bonus || 0), 0)
    const totalDeduction = details.reduce((sum, detail) => sum + (detail.deduction || 0), 0)
    const totalNetPay = details.reduce((sum, detail) => sum + (detail.net_pay || 0), 0)

    // Validation checks
    const validationIssues = []
    let employeesWithNegativeNetPay = 0
    let employeesWithMissingData = 0

    details.forEach((detail, index) => {
      // Check for negative net pay
      if (detail.net_pay < 0) {
        employeesWithNegativeNetPay++
        validationIssues.push({
          type: 'negative_net_pay',
          employee_name: detail.users.full_name,
          employee_id: detail.users.employee_id,
          net_pay: detail.net_pay
        })
      }

      // Check for missing essential data
      if (!detail.users.full_name || detail.base_pay === null || detail.base_pay === undefined) {
        employeesWithMissingData++
        validationIssues.push({
          type: 'missing_data',
          employee_name: detail.users.full_name || 'Unknown',
          employee_id: detail.users.employee_id,
          missing_fields: []
        })
      }
    })

    // Determine if cycle can be finalized
    const canFinalize = validationIssues.length === 0 && cycle.status === 'active'

    // Get statistics by branch
    const branchStats = details.reduce((acc, detail) => {
      const branchId = detail.users.branches?.id || 'no_branch'
      const branchName = detail.users.branches?.name || 'ไม่มีสาขา'
      
      if (!acc[branchId]) {
        acc[branchId] = {
          branch_id: branchId,
          branch_name: branchName,
          employee_count: 0,
          total_net_pay: 0,
          total_base_pay: 0,
          total_bonus: 0,
          total_deduction: 0
        }
      }
      
      acc[branchId].employee_count++
      acc[branchId].total_net_pay += detail.net_pay || 0
      acc[branchId].total_base_pay += detail.base_pay || 0
      acc[branchId].total_bonus += detail.bonus || 0
      acc[branchId].total_deduction += detail.deduction || 0
      
      return acc
    }, {} as Record<string, {
      branch_id: string;
      branch_name: string;
      employee_count: number;
      total_net_pay: number;
      total_base_pay: number;
      total_bonus: number;
      total_deduction: number;
    }>)

    const summary = {
      cycle_info: {
        id: cycle.id,
        name: cycle.cycle_name,
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        status: cycle.status,
        created_at: cycle.created_at,
        finalized_at: cycle.finalized_at
      },
      totals: {
        total_employees: totalEmployees,
        total_base_pay: totalBasePay,
        total_overtime_pay: totalOvertimePay,
        total_bonus: totalBonus,
        total_deduction: totalDeduction,
        total_net_pay: totalNetPay,
        average_net_pay: totalEmployees > 0 ? totalNetPay / totalEmployees : 0
      },
      validation: {
        can_finalize: canFinalize,
        issues_count: validationIssues.length,
        employees_with_negative_net_pay: employeesWithNegativeNetPay,
        employees_with_missing_data: employeesWithMissingData,
        validation_issues: validationIssues
      },
      branch_breakdown: Object.values(branchStats),
      employee_details: details.map(detail => ({
        id: detail.id,
        user_id: detail.user_id,
        employee_name: detail.users.full_name,
        employee_id: detail.users.employee_id,
        branch_name: detail.users.branches?.name || 'ไม่มีสาขา',
        base_pay: detail.base_pay,
        overtime_pay: detail.overtime_pay,
        bonus: detail.bonus,
        bonus_reason: detail.bonus_reason,
        deduction: detail.deduction,
        deduction_reason: detail.deduction_reason,
        net_pay: detail.net_pay,
        calculation_method: detail.calculation_method
      }))
    }

    return NextResponse.json({
      message: 'ดึงข้อมูลสรุปรอบการจ่ายเงินเดือนเรียบร้อยแล้ว',
      summary
    })

  } catch (error) {
    console.error('Payroll summary error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปรอบการจ่ายเงินเดือน' },
      { status: 500 }
    )
  }
}
