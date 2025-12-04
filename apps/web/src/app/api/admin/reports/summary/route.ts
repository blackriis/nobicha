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
    const branchId = searchParams.get('branchId')

    // Calculate date filter based on range
    // Use Thailand timezone (Asia/Bangkok, UTC+7) for date calculations
    const now = new Date()
    // Get current date in Thailand timezone
    const thailandDateStr = now.toLocaleDateString('en-CA', { 
      timeZone: 'Asia/Bangkok' 
    }) // Returns YYYY-MM-DD format
    
    let computedStartDate: string
    let computedEndDate: string = thailandDateStr

    switch (dateRange) {
      case 'today': {
        computedStartDate = computedEndDate
        break
      }
      case 'week': {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        computedStartDate = weekAgo.toLocaleDateString('en-CA', { 
          timeZone: 'Asia/Bangkok' 
        })
        break
      }
      case 'month': {
        const monthAgo = new Date(now)
        monthAgo.setDate(monthAgo.getDate() - 30)
        computedStartDate = monthAgo.toLocaleDateString('en-CA', { 
          timeZone: 'Asia/Bangkok' 
        })
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
      totalBranchesResult,
      activeBranchesResult,
      todayCheckInsResult,
      totalSalesResult,
      totalMaterialsResult,
      recentMaterialUsageResult
    ] = await Promise.all([
      // Total employees count
      (() => {
        let query = adminClient
          .from('users')
          .select('id', { count: 'exact' })
          .eq('role', 'employee')
          .eq('is_active', true)
        if (branchId) {
          query = query.eq('branch_id', branchId)
        }
        return query
      })(),
      
      // Total branches count
      (() => {
        let query = adminClient
          .from('branches')
          .select('id', { count: 'exact' })
        if (branchId) {
          query = query.eq('id', branchId)
        }
        return query
      })(),
      
      // Active branches count (unique branches with check-ins today)
      (async () => {
        // Use date range that covers the entire day in Thailand timezone (UTC+7)
        const startOfDay = new Date(computedStartDate + 'T00:00:00+07:00')
        const endOfDay = new Date(computedEndDate + 'T23:59:59+07:00')
        
        let query = adminClient
          .from('time_entries')
          .select('branch_id')
          .gte('check_in_time', startOfDay.toISOString())
          .lte('check_in_time', endOfDay.toISOString())
          .not('branch_id', 'is', null)
        if (branchId) {
          query = query.eq('branch_id', branchId)
        }
        const result = await query
        if (result.error) {
          return { data: null, error: result.error, count: 0 }
        }
        // Count unique branch IDs
        const uniqueBranches = new Set(result.data?.map(entry => entry.branch_id).filter(Boolean) || [])
        return { data: null, error: null, count: uniqueBranches.size }
      })(),
      
      // Today's check-ins count (unique employees)
      // Use date range that covers the entire day in Thailand timezone (UTC+7)
      (async () => {
        // Start of day in Thailand timezone (00:00:00 Asia/Bangkok)
        const startOfDay = new Date(computedStartDate + 'T00:00:00+07:00')
        // End of day in Thailand timezone (23:59:59.999 Asia/Bangkok)
        const endOfDay = new Date(computedEndDate + 'T23:59:59.999+07:00')
        
        let query = adminClient
          .from('time_entries')
          .select('user_id')
          .gte('check_in_time', startOfDay.toISOString())
          .lte('check_in_time', endOfDay.toISOString())
        if (branchId) {
          query = query.eq('branch_id', branchId)
        }
        const result = await query
        if (result.error) {
          console.error('❌ Error querying check-ins:', result.error)
          return { data: null, error: result.error, count: 0 }
        }
        // Count unique user IDs
        const uniqueUsers = new Set(result.data?.map(entry => entry.user_id).filter(Boolean) || [])
        console.log('📊 Check-ins today:', {
          dateRange: { computedStartDate, computedEndDate },
          startOfDay: startOfDay.toISOString(),
          endOfDay: endOfDay.toISOString(),
          totalEntries: result.data?.length || 0,
          uniqueUsers: uniqueUsers.size,
          userIds: Array.from(uniqueUsers)
        })
        return { data: null, error: null, count: uniqueUsers.size }
      })(),
      
      // Total sales for date range
      // Use timezone-aware date range that covers the entire day in Thailand timezone (UTC+7)
      (async () => {
        // Calculate UTC times that correspond to start/end of day in Thailand timezone (UTC+7)
        // Start of day in Thailand (00:00:00 UTC+7) = 17:00:00 UTC of previous day
        // End of day in Thailand (23:59:59.999 UTC+7) = 16:59:59.999 UTC of same day
        const startOfDayThailand = new Date(computedStartDate + 'T00:00:00+07:00')
        const endOfDayThailand = new Date(computedEndDate + 'T23:59:59.999+07:00')
        
        // Convert to ISO strings (which are in UTC) - this correctly represents the Thailand day boundaries
        const startOfDayUTC = startOfDayThailand.toISOString()
        const endOfDayUTC = endOfDayThailand.toISOString()
        
        let query = adminClient
          .from('sales_reports')
          .select('total_sales')
          .gte('created_at', startOfDayUTC)
          .lte('created_at', endOfDayUTC)
        if (branchId) {
          query = query.eq('branch_id', branchId)
        }
        const result = await query
        if (result.error) {
          return { data: null, error: result.error, count: 0 }
        }
        // Return consistent structure matching other query results
        // Include count property for consistency with other parallel queries
        return { data: result.data || null, error: null, count: result.data?.length || 0 }
      })(),
      
      // Total raw materials count
      adminClient
        .from('raw_materials')
        .select('id', { count: 'exact' })
        .eq('is_active', true),
      
      // Recent material usage (for today's cost)
      // Note: material_usage doesn't have branch_id directly, need to join through time_entries
      // If branchId is specified, we'll handle it separately after getting time entries
      branchId ? Promise.resolve({ data: [], error: null }) : (async () => {
        // Use timezone-aware date range that covers the entire day in Thailand timezone (UTC+7)
        const startOfDayThailand = new Date(computedStartDate + 'T00:00:00+07:00')
        const endOfDayThailand = new Date(computedEndDate + 'T23:59:59.999+07:00')
        
        // Convert to ISO strings (which are in UTC) - this correctly represents the Thailand day boundaries
        const startOfDayUTC = startOfDayThailand.toISOString()
        const endOfDayUTC = endOfDayThailand.toISOString()
        
        const result = await adminClient
        .from('material_usage')
        .select('total_cost')
          .gte('created_at', startOfDayUTC)
          .lte('created_at', endOfDayUTC)
        
        if (result.error) {
          return { data: [], error: result.error }
        }
        return { data: result.data || [], error: null }
      })()
    ])

    // Process total sales calculation
    const totalSales = totalSalesResult.data?.reduce((sum, report) => sum + (report.total_sales || 0), 0) || 0
    
    // Process material usage cost
    // If branchId is specified, we need to get time_entry_ids first, then query material_usage
    let totalMaterialUsageCost = 0
    if (branchId) {
      // Use timezone-aware date range that covers the entire day in Thailand timezone (UTC+7)
      const startOfDayThailand = new Date(computedStartDate + 'T00:00:00+07:00')
      const endOfDayThailand = new Date(computedEndDate + 'T23:59:59.999+07:00')
      
      // Convert to ISO strings (which are in UTC) - this correctly represents the Thailand day boundaries
      const startOfDayUTC = startOfDayThailand.toISOString()
      const endOfDayUTC = endOfDayThailand.toISOString()
      
      // Get time entries for the specified branch
      const { data: branchTimeEntries, error: timeEntriesError } = await adminClient
        .from('time_entries')
        .select('id')
        .eq('branch_id', branchId)
        .gte('check_in_time', startOfDayUTC)
        .lte('check_in_time', endOfDayUTC)
      
      console.log('📊 Branch time entries:', {
        branchId,
        count: branchTimeEntries?.length || 0,
        error: timeEntriesError?.message
      })
      
      if (branchTimeEntries && branchTimeEntries.length > 0) {
        const timeEntryIds = branchTimeEntries.map(entry => entry.id)
        // Use the same timezone-aware date range for material_usage query
        const { data: branchMaterialUsage, error: materialError } = await adminClient
          .from('material_usage')
          .select('total_cost')
          .in('time_entry_id', timeEntryIds)
          .gte('created_at', startOfDayUTC)
          .lte('created_at', endOfDayUTC)
        
        console.log('📊 Branch material usage:', {
          branchId,
          timeEntryIds: timeEntryIds.length,
          usageCount: branchMaterialUsage?.length || 0,
          error: materialError?.message
        })
        
        totalMaterialUsageCost = branchMaterialUsage?.reduce((sum, usage) => {
          const cost = usage.total_cost || 0
          console.log('💰 Material usage cost:', cost)
          return sum + cost
        }, 0) || 0
      }
    } else {
      console.log('📊 All branches material usage:', {
        dataCount: recentMaterialUsageResult.data?.length || 0,
        error: recentMaterialUsageResult.error?.message
      })
      
      totalMaterialUsageCost = recentMaterialUsageResult.data?.reduce((sum, usage) => {
        const cost = usage.total_cost || 0
        console.log('💰 Material usage cost:', cost)
        return sum + cost
      }, 0) || 0
    }
    
    console.log('💰 Total material usage cost:', totalMaterialUsageCost)

    // Build summary response
    const summary = {
      employees: {
        total: totalEmployeesResult.count || 0,
        checkedInToday: todayCheckInsResult.count || 0,
        attendanceRate: totalEmployeesResult.count ? 
          Math.round(((todayCheckInsResult.count || 0) / totalEmployeesResult.count) * 100) : 0
      },
      branches: {
        total: totalBranchesResult.count || 0,
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