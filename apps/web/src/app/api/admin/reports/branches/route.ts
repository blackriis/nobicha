import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limit'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/admin/reports/branches - Get branch performance reports
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
    const branchId = searchParams.get('branchId')

    // Calculate date filter
    const now = new Date()
    let dateFilter = ''
    
    switch (dateRange) {
      case 'today':
        dateFilter = now.toISOString().split('T')[0]
        break
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = weekAgo.toISOString().split('T')[0]
        break
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = monthAgo.toISOString().split('T')[0]
        break
      }
      case 'custom':
        dateFilter = startDate || now.toISOString().split('T')[0]
        break
      default:
        dateFilter = now.toISOString().split('T')[0]
    }

    // Fetch all branches (or specific branch if branchId is provided)
    let branchesQuery = adminClient
      .from('branches')
      .select('id, name, address')
      .order('name')
    
    if (branchId) {
      branchesQuery = branchesQuery.eq('id', branchId)
    }
    
    const { data: branches, error: branchesError } = await branchesQuery

    if (branchesError) {
      console.error('Branches query error:', branchesError)
      return NextResponse.json(
        { error: 'Failed to fetch branches' },
        { status: 500 }
      )
    }

    // Fetch branch performance data
    const branchReports = await Promise.all(
      branches?.map(async (branch) => {
        const [salesData, employeeData, timeEntriesData] = await Promise.all([
          // Sales data for this branch
          adminClient
            .from('sales_reports')
            .select('total_sales')
            .eq('branch_id', branch.id)
            .gte('created_at', dateFilter),
          
          // Employee count at this branch
          adminClient
            .from('users')
            .select('id', { count: 'exact' })
            .eq('branch_id', branch.id)
            .eq('role', 'employee')
            .eq('is_active', true),
          
          // Time entries data for this branch
          adminClient
            .from('time_entries')
            .select('id, total_hours, check_out_time')
            .eq('branch_id', branch.id)
            .gte('check_in_time', dateFilter)
        ])

        // Calculate metrics
        const totalSales = salesData.data?.reduce((sum, sale) => sum + (sale.total_sales || 0), 0) || 0
        const employeeCount = employeeData.count || 0
        const totalHours = timeEntriesData.data?.reduce((sum, entry) => sum + (entry.total_hours || 0), 0) || 0
        const activeToday = timeEntriesData.data?.filter(entry => !entry.check_out_time).length || 0
        const totalSessions = timeEntriesData.data?.length || 0

        return {
          branchId: branch.id,
          branchName: branch.name,
          address: branch.address,
          sales: {
            total: totalSales,
            currency: 'THB'
          },
          employees: {
            total: employeeCount,
            activeToday: activeToday,
            attendanceRate: employeeCount > 0 ? Math.round((activeToday / employeeCount) * 100) : 0
          },
          workHours: {
            total: Math.round(totalHours * 100) / 100,
            sessions: totalSessions,
            averagePerSession: totalSessions > 0 ? Math.round((totalHours / totalSessions) * 100) / 100 : 0
          },
          performance: {
            salesPerEmployee: employeeCount > 0 ? Math.round(totalSales / employeeCount) : 0,
            salesPerHour: totalHours > 0 ? Math.round(totalSales / totalHours) : 0
          }
        }
      }) || []
    )

    // Sort by total sales (highest first)
    branchReports.sort((a, b) => b.sales.total - a.sales.total)

    // Calculate summary statistics
    const summary = {
      totalBranches: branchReports.length,
      totalSales: branchReports.reduce((sum, branch) => sum + branch.sales.total, 0),
      totalEmployees: branchReports.reduce((sum, branch) => sum + branch.employees.total, 0),
      totalActiveToday: branchReports.reduce((sum, branch) => sum + branch.employees.activeToday, 0),
      totalWorkHours: branchReports.reduce((sum, branch) => sum + branch.workHours.total, 0),
      averageSalesPerBranch: branchReports.length > 0 ? 
        Math.round(branchReports.reduce((sum, branch) => sum + branch.sales.total, 0) / branchReports.length) : 0,
      averageEmployeesPerBranch: branchReports.length > 0 ? 
        Math.round(branchReports.reduce((sum, branch) => sum + branch.employees.total, 0) / branchReports.length) : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        branches: branchReports,
        dateRange: {
          type: dateRange,
          startDate: startDate || dateFilter.split('T')[0],
          endDate: endDate || now.toISOString().split('T')[0]
        }
      }
    })

  } catch (error) {
    console.error('GET /api/admin/reports/branches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}