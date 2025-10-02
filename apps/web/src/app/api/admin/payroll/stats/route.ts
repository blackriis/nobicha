import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { authRateLimiter } from '@/lib/rate-limit'

// Type definitions for query results
interface PayrollDetail {
  net_pay: number
}

interface PayrollCycle {
  id: string
  end_date: string
  payroll_details: PayrollDetail[] | null
}

// GET /api/admin/payroll/stats - Get payroll statistics
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'คำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง' },
        { status: 429 }
      )
    }

    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Get user profile and check admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'ต้องมีสิทธิ์ admin เท่านั้น' },
        { status: 403 }
      )
    }

    // Execute parallel queries for statistics
    const [
      activeCyclesResult,
      totalEmployeesResult,
      monthlyPayrollResult,
      pendingApprovalsResult,
      recentPayrollResult
    ] = await Promise.all([
      // Active payroll cycles count
      supabase
        .from('payroll_cycles')
        .select('id', { count: 'exact' })
        .eq('status', 'active'),

      // Total employees with payroll data
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'employee')
        .eq('is_active', true),

      // Monthly payroll calculation (current month completed cycles)
      supabase
        .from('payroll_cycles')
        .select(`
          id,
          payroll_details(
            net_pay
          )
        `)
        .eq('status', 'completed')
        .gte('end_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
        .lt('end_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0]),

      // Pending approvals (active cycles that have payroll details calculated but not finalized)
      supabase
        .from('payroll_cycles')
        .select(`
          id,
          payroll_details(id)
        `)
        .eq('status', 'active'),

      // Recent payroll trend (last 3 months for comparison)
      supabase
        .from('payroll_cycles')
        .select(`
          id,
          end_date,
          payroll_details(
            net_pay
          )
        `)
        .eq('status', 'completed')
        .gte('end_date', new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0])
        .order('end_date', { ascending: false })
    ])

    // Handle database errors
    if (activeCyclesResult.error) {
      console.error('Active cycles query error:', activeCyclesResult.error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรอบการจ่ายที่เปิดอยู่' },
        { status: 500 }
      )
    }

    if (totalEmployeesResult.error) {
      console.error('Total employees query error:', totalEmployeesResult.error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลจำนวนพนักงาน' },
        { status: 500 }
      )
    }

    if (monthlyPayrollResult.error) {
      console.error('Monthly payroll query error:', monthlyPayrollResult.error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการคำนวณยอดจ่ายรายเดือน' },
        { status: 500 }
      )
    }

    if (pendingApprovalsResult.error) {
      console.error('Pending approvals query error:', pendingApprovalsResult.error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรออนุมัติ' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const activeCycles = activeCyclesResult.count || 0
    const totalEmployees = totalEmployeesResult.count || 0
    
    // Count cycles that have payroll details (pending approvals)
    let pendingApprovals = 0
    if (pendingApprovalsResult.data) {
      pendingApprovals = (pendingApprovalsResult.data as PayrollCycle[]).filter((cycle) => 
        cycle.payroll_details && 
        Array.isArray(cycle.payroll_details) && 
        cycle.payroll_details.length > 0
      ).length
    }

    // Calculate monthly payroll total
    let monthlyPayroll = 0
    if (monthlyPayrollResult.data) {
      for (const cycle of monthlyPayrollResult.data as PayrollCycle[]) {
        if (cycle.payroll_details && Array.isArray(cycle.payroll_details)) {
          monthlyPayroll += cycle.payroll_details.reduce((sum: number, detail: PayrollDetail) => {
            return sum + (detail.net_pay || 0)
          }, 0)
        }
      }
    }

    // Calculate growth percentage (compare with previous month)
    let growthPercentage = 0
    if (recentPayrollResult.data && recentPayrollResult.data.length > 0) {
      const currentMonth = new Date().getMonth()
      const recentData = recentPayrollResult.data as PayrollCycle[]
      
      const currentMonthData = recentData.filter((cycle) => {
        const cycleMonth = new Date(cycle.end_date).getMonth()
        return cycleMonth === currentMonth
      })
      
      const previousMonthData = recentData.filter((cycle) => {
        const cycleMonth = new Date(cycle.end_date).getMonth()
        return cycleMonth === (currentMonth - 1 + 12) % 12
      })

      if (currentMonthData.length > 0 && previousMonthData.length > 0) {
        const currentTotal = currentMonthData.reduce((sum: number, cycle) => {
          if (cycle.payroll_details && Array.isArray(cycle.payroll_details)) {
            return sum + cycle.payroll_details.reduce((detailSum: number, detail: PayrollDetail) => {
              return detailSum + (detail.net_pay || 0)
            }, 0)
          }
          return sum
        }, 0)

        const previousTotal = previousMonthData.reduce((sum: number, cycle) => {
          if (cycle.payroll_details && Array.isArray(cycle.payroll_details)) {
            return sum + cycle.payroll_details.reduce((detailSum: number, detail: PayrollDetail) => {
              return detailSum + (detail.net_pay || 0)
            }, 0)
          }
          return sum
        }, 0)

        if (previousTotal > 0) {
          growthPercentage = Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
        }
      }
    }

    const stats = {
      activeCycles,
      totalEmployees,
      monthlyPayroll: Math.round(monthlyPayroll),
      pendingApprovals,
      growthPercentage,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('GET /api/admin/payroll/stats error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}