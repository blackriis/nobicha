import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generalRateLimiter, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateLimitResult = generalRateLimiter.isRateLimited(request)
    if (rateLimitResult.limited) {
      return createRateLimitResponse(rateLimitResult.resetTime!, generalRateLimiter)
    }

    const supabase = await createClient()
    const { id: cycleId } = await params

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv' // csv or json
    const includeDetails = searchParams.get('include_details') === 'true'

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

    // Get payroll cycle
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

    // Get payroll details with employee information
    const { data: payrollDetails, error: detailsError } = await supabase
      .from('payroll_details')
      .select(`
        *,
        users!inner (
          id,
          full_name,
          employee_id,
          email,
          phone_number,
          branches (
            id,
            name,
            address
          )
        )
      `)
      .eq('payroll_cycle_id', cycleId)
      .order('users(full_name)', { ascending: true })

    if (detailsError) {
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดเงินเดือน' },
        { status: 500 }
      )
    }

    const details = payrollDetails || []

    // Calculate totals
    const totalEmployees = details.length
    const totalBasePay = details.reduce((sum, detail) => sum + (detail.base_pay || 0), 0)
    const totalOvertimePay = details.reduce((sum, detail) => sum + (detail.overtime_pay || 0), 0)
    const totalBonus = details.reduce((sum, detail) => sum + (detail.bonus || 0), 0)
    const totalDeduction = details.reduce((sum, detail) => sum + (detail.deduction || 0), 0)
    const totalNetPay = details.reduce((sum, detail) => sum + (detail.net_pay || 0), 0)

    // Format Thai date
    const formatThaiDate = (dateString: string): string => {
      try {
        return new Date(dateString).toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      } catch {
        return dateString
      }
    }

    // Format currency
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
      }).format(amount)
    }

    if (format === 'csv') {
      // Generate CSV content
      let csvContent = '\uFEFF' // UTF-8 BOM for Excel compatibility
      
      // Header
      csvContent += `รายงานเงินเดือน: ${cycle.name}\n`
      csvContent += `ช่วงเวลา: ${formatThaiDate(cycle.start_date)} - ${formatThaiDate(cycle.end_date)}\n`
      csvContent += `สถานะ: ${cycle.status === 'completed' ? 'ปิดรอบแล้ว' : 'ยังไม่ปิดรอบ'}\n`
      csvContent += `จำนวนพนักงาน: ${totalEmployees} คน\n`
      csvContent += `เงินเดือนรวม: ${formatCurrency(totalNetPay)}\n`
      csvContent += `วันที่สร้างรายงาน: ${formatThaiDate(new Date().toISOString())}\n\n`

      // Column headers
      csvContent += 'ลำดับ,รหัสพนักงาน,ชื่อ-นามสกุล,สาขา,ค่าแรงพื้นฐาน,ค่าล่วงเวลา,โบนัส,เหตุผลโบนัส,หักเงิน,เหตุผลหักเงิน,เงินเดือนสุทธิ,วิธีคำนวณ\n'

      // Data rows
      details.forEach((detail, index) => {
        const row = [
          index + 1,
          `"${detail.users.employee_id || ''}"`,
          `"${detail.users.full_name || ''}"`,
          `"${detail.users.branches?.name || 'ไม่มีสาขา'}"`,
          detail.base_pay || 0,
          detail.overtime_pay || 0,
          detail.bonus || 0,
          `"${detail.bonus_reason || ''}"`,
          detail.deduction || 0,
          `"${detail.deduction_reason || ''}"`,
          detail.net_pay || 0,
          `"${detail.calculation_method || ''}"`,
        ].join(',')
        
        csvContent += row + '\n'
      })

      // Summary
      csvContent += '\n=== สรุปยอดรวม ===\n'
      csvContent += `จำนวนพนักงานทั้งหมด,${totalEmployees}\n`
      csvContent += `ค่าแรงพื้นฐานรวม,${totalBasePay}\n`
      csvContent += `ค่าล่วงเวลารวม,${totalOvertimePay}\n`
      csvContent += `โบนัสรวม,${totalBonus}\n`
      csvContent += `หักเงินรวม,${totalDeduction}\n`
      csvContent += `เงินเดือนสุทธิรวม,${totalNetPay}\n`

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="payroll-${cycle.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      // JSON format
      const exportData = {
        cycle_info: {
          id: cycle.id,
          name: cycle.name,
          start_date: cycle.start_date,
          end_date: cycle.end_date,
          status: cycle.status,
          finalized_at: cycle.finalized_at,
          created_at: cycle.created_at
        },
        summary: {
          total_employees: totalEmployees,
          total_base_pay: totalBasePay,
          total_overtime_pay: totalOvertimePay,
          total_bonus: totalBonus,
          total_deduction: totalDeduction,
          total_net_pay: totalNetPay,
          average_net_pay: totalEmployees > 0 ? totalNetPay / totalEmployees : 0
        },
        employee_details: includeDetails ? details.map((detail, index) => ({
          order: index + 1,
          employee_id: detail.users.employee_id,
          full_name: detail.users.full_name,
          email: detail.users.email,
          phone_number: detail.users.phone_number,
          branch: {
            id: detail.users.branches?.id,
            name: detail.users.branches?.name || 'ไม่มีสาขา',
            address: detail.users.branches?.address
          },
          payroll: {
            base_pay: detail.base_pay,
            overtime_pay: detail.overtime_pay,
            bonus: detail.bonus,
            bonus_reason: detail.bonus_reason,
            deduction: detail.deduction,
            deduction_reason: detail.deduction_reason,
            net_pay: detail.net_pay,
            calculation_method: detail.calculation_method
          }
        })) : [],
        export_info: {
          exported_at: new Date().toISOString(),
          exported_by: user.id,
          format: 'json',
          include_details: includeDetails
        }
      }

      return NextResponse.json({
        message: 'ส่งออกข้อมูลเงินเดือนเรียบร้อยแล้ว',
        export_data: exportData
      })
    }

  } catch (error) {
    console.error('Payroll export error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการส่งออกข้อมูลเงินเดือน' },
      { status: 500 }
    )
  }
}
