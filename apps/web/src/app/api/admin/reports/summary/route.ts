import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limit'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/admin/reports/summary - Get overall summary statistics
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
    const { data: userProfile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Failed to verify user role' },
        { status: 403 }
      )
    }

    if ((userProfile as { role: string }).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters for date range
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || 'today'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date filter based on range (also expose accurate display dates)
    const now = new Date()
    let computedStartDate: string
    let computedEndDate: string = now.toISOString().split('T')[0]

    switch (dateRange) {
      case 'today': {
        computedStartDate = computedEndDate
        break
      }
      case 'week': {
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        computedStartDate = weekStart.toISOString().split('T')[0]
        break
      }
      case 'month': {
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        computedStartDate = monthStart.toISOString().split('T')[0]
        break
      }
      case 'custom': {
        computedStartDate = (startDate || computedEndDate)
        computedEndDate = (endDate || computedEndDate)
        break
      }
      default: {
        computedStartDate = computedEndDate
      }
    }

    // Fetch summary statistics using parallel queries
    const [
      totalEmployeesResult,
      activeBranchesResult,
      todayCheckInsResult,
      totalSalesResult,
      totalMaterialsResult,
      recentMaterialUsageResult
    ] = await Promise.all([
      // Total employees count
      adminClient
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'employee')
        .eq('is_active', true),
      
      // Active branches count
      adminClient
        .from('branches')
        .select('id', { count: 'exact' }),
      
      // Today's check-ins count
      adminClient
        .from('time_entries')
        .select('id', { count: 'exact' })
        .gte('check_in_time', now.toISOString().split('T')[0]),
      
      // Total sales for date range
      adminClient
        .from('sales_reports')
        .select('total_sales')
        .filter('created_at', 'gte', 
          dateRange === 'today' ? now.toISOString().split('T')[0] :
          dateRange === 'week' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() :
          dateRange === 'month' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() :
          startDate || now.toISOString().split('T')[0]
        ),
      
      // Total raw materials count
      adminClient
        .from('raw_materials')
        .select('id', { count: 'exact' })
        .eq('is_active', true),
      
      // Recent material usage (for trend)
      adminClient
        .from('material_usage')
        .select('total_cost')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
    ])

    // Process total sales calculation
    const totalSales = totalSalesResult.data?.reduce((sum, report) => sum + (report.total_sales || 0), 0) || 0
    
    // Process material usage cost
    const totalMaterialUsageCost = recentMaterialUsageResult.data?.reduce((sum, usage) => sum + (usage.total_cost || 0), 0) || 0

    // Build summary response
    const summary = {
      employees: {
        total: totalEmployeesResult.count || 0,
        checkedInToday: todayCheckInsResult.count || 0,
        attendanceRate: totalEmployeesResult.count ? 
          Math.round(((todayCheckInsResult.count || 0) / totalEmployeesResult.count) * 100) : 0
      },
      branches: {
        total: activeBranchesResult.count || 0,
        active: activeBranchesResult.count || 0
      },
      sales: {
        total: totalSales,
        period: dateRange,
        currency: 'THB'
      },
      materials: {
        totalItems: totalMaterialsResult.count || 0,
        recentUsageCost: totalMaterialUsageCost,
        currency: 'THB'
      },
      dateRange: {
        type: dateRange,
        startDate: startDate || computedStartDate,
        endDate: endDate || computedEndDate
      }
    }

    return NextResponse.json({
      success: true,
      data: summary
    })

  } catch (error) {
    console.error('GET /api/admin/reports/summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
