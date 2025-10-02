import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limit'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/admin/reports/sales - Get sales reports with breakdown
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check (cookie-based)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile and check role using service role client to bypass RLS
    const adminClient = await createSupabaseServerClient()
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile as { role: string }).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || 'today'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Calculate date filter
    const now = new Date()
    let dateFilter = ''
    
    switch (dateRange) {
      case 'today':
        dateFilter = now.toISOString().split('T')[0]
        break
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'custom':
        dateFilter = startDate || now.toISOString().split('T')[0]
        break
      default:
        dateFilter = now.toISOString().split('T')[0]
    }

    // Fetch sales reports with related data
    const { data: salesData, error } = await adminClient
      .from('sales_reports')
      .select(`
        id,
        branch_id,
        user_id,
        report_date,
        total_sales,
        created_at,
        branches!inner(
          id,
          name
        ),
        users!inner(
          id,
          full_name,
          employee_id
        )
      `)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Sales reports query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sales reports' },
        { status: 500 }
      )
    }

    // Process sales data
    const salesReports = salesData?.map((sale: any) => ({
      id: sale.id,
      branchId: sale.branch_id,
      branchName: sale.branches.name,
      userId: sale.user_id,
      employeeName: sale.users.full_name,
      employeeId: sale.users.employee_id,
      reportDate: sale.report_date,
      totalSales: sale.total_sales,
      createdAt: sale.created_at
    })) || []

    // Calculate daily breakdown
    const dailyBreakdown = new Map()
    salesReports.forEach(sale => {
      const date = sale.reportDate || sale.createdAt.split('T')[0]
      if (!dailyBreakdown.has(date)) {
        dailyBreakdown.set(date, {
          date,
          totalSales: 0,
          reportCount: 0,
          branches: new Set()
        })
      }
      const day = dailyBreakdown.get(date)
      day.totalSales += sale.totalSales
      day.reportCount += 1
      day.branches.add(sale.branchName)
    })

    // Convert daily breakdown to array and format
    const dailySales = Array.from(dailyBreakdown.values())
      .map(day => ({
        ...day,
        branches: Array.from(day.branches),
        averageSalePerReport: day.reportCount > 0 ? Math.round(day.totalSales / day.reportCount) : 0
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate branch breakdown
    const branchBreakdown = new Map()
    salesReports.forEach(sale => {
      if (!branchBreakdown.has(sale.branchId)) {
        branchBreakdown.set(sale.branchId, {
          branchId: sale.branchId,
          branchName: sale.branchName,
          totalSales: 0,
          reportCount: 0,
          employees: new Set()
        })
      }
      const branch = branchBreakdown.get(sale.branchId)
      branch.totalSales += sale.totalSales
      branch.reportCount += 1
      branch.employees.add(sale.employeeName)
    })

    // Convert branch breakdown to array and format
    const branchSales = Array.from(branchBreakdown.values())
      .map(branch => ({
        ...branch,
        employees: Array.from(branch.employees),
        averageSalePerReport: branch.reportCount > 0 ? Math.round(branch.totalSales / branch.reportCount) : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)

    // Calculate summary statistics
    const summary = {
      totalSales: salesReports.reduce((sum, sale) => sum + sale.totalSales, 0),
      totalReports: salesReports.length,
      uniqueBranches: new Set(salesReports.map(sale => sale.branchId)).size,
      uniqueEmployees: new Set(salesReports.map(sale => sale.userId)).size,
      averageSalePerReport: salesReports.length > 0 ? 
        Math.round(salesReports.reduce((sum, sale) => sum + sale.totalSales, 0) / salesReports.length) : 0,
      topPerformingBranch: branchSales.length > 0 ? branchSales[0].branchName : null,
      topPerformingBranchSales: branchSales.length > 0 ? branchSales[0].totalSales : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        dailyBreakdown: dailySales,
        branchBreakdown: branchSales,
        recentReports: salesReports.slice(0, 20), // Latest 20 reports
        dateRange: {
          type: dateRange,
          startDate: startDate || dateFilter.split('T')[0],
          endDate: endDate || now.toISOString().split('T')[0]
        }
      }
    })

  } catch (error) {
    console.error('GET /api/admin/reports/sales error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}