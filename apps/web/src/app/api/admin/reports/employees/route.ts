import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limit'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient as createDirectClient } from '@supabase/supabase-js'
import { config } from '@employee-management/config'

// GET /api/admin/reports/employees - Get employee work reports
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

    console.log('Admin user verified:', user.id, 'role:', userProfile.role)

    // Create direct client with service role key (same as hardcoded test)
    const directClient = createDirectClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    // Default to 'month' to avoid empty results when data exists within the last 30 days
    const dateRange = searchParams.get('dateRange') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Calculate date filter
    const now = new Date()
    let computedStartDate: string | null = null
    let computedEndDate: string | null = now.toISOString().split('T')[0]

    // Step 1: Get time entries using direct client
    console.log('Step 1: Getting time entries...')
    const { data: timeEntries, error: timeError } = await directClient
      .from('time_entries')
      .select('id, user_id, branch_id, check_in_time, check_out_time, total_hours')
      .order('check_in_time', { ascending: false })
      .limit(limit)

    if (timeError) {
      console.error('Time entries error:', timeError)
      return NextResponse.json(
        { error: 'Failed to fetch time entries' },
        { status: 500 }
      )
    }

    console.log('Time entries found:', timeEntries?.length || 0)

    // Step 2: Get users data
    const userIds = [...new Set(timeEntries?.map(entry => entry.user_id) || [])]
    const { data: users, error: usersError } = await directClient
      .from('users')
      .select('id, full_name, employee_id')
      .in('id', userIds)

    if (usersError) {
      console.error('Users error:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    console.log('Users found:', users?.length || 0)

    // Step 3: Get branches data
    const branchIds = [...new Set(timeEntries?.map(entry => entry.branch_id) || [])]
    const { data: branches, error: branchesError } = await directClient
      .from('branches')
      .select('id, name')
      .in('id', branchIds)

    if (branchesError) {
      console.error('Branches error:', branchesError)
      return NextResponse.json(
        { error: 'Failed to fetch branches' },
        { status: 500 }
      )
    }

    console.log('Branches found:', branches?.length || 0)

    // Step 4: Combine data manually
    const usersMap = new Map(users?.map(user => [user.id, user]) || [])
    const branchesMap = new Map(branches?.map(branch => [branch.id, branch]) || [])

    const employeeData = timeEntries?.map(entry => ({
      ...entry,
      users: usersMap.get(entry.user_id),
      branches: branchesMap.get(entry.branch_id)
    })).filter(entry => entry.users && entry.branches) || []
    
    console.log('Combined employee data:', employeeData?.length || 0)

    // Process and aggregate employee data
    const employeeMap = new Map()
    
    console.log('Processing employee data entries:', employeeData?.length || 0)
    
    employeeData?.forEach((entry: any) => {
      const userId = entry.user_id
      const userData = entry.users
      const branchData = entry.branches
      
      if (!employeeMap.has(userId)) {
        employeeMap.set(userId, {
          userId,
          fullName: userData.full_name,
          employeeId: userData.employee_id,
          totalHours: 0,
          totalSessions: 0,
          branches: new Set(),
          lastCheckIn: null,
          status: 'offline'
        })
      }
      
      const employee = employeeMap.get(userId)
      employee.totalHours += entry.total_hours || 0
      employee.totalSessions += 1
      employee.branches.add(branchData.name)
      
      // Check if currently working (no check_out_time)
      if (!entry.check_out_time && (!employee.lastCheckIn || entry.check_in_time > employee.lastCheckIn)) {
        employee.lastCheckIn = entry.check_in_time
        employee.status = 'working'
      }
    })

    // Convert to array and format data
    const employeeReports = Array.from(employeeMap.values()).map(employee => ({
      userId: employee.userId,
      fullName: employee.fullName,
      employeeId: employee.employeeId,
      totalHours: Math.round(employee.totalHours * 100) / 100,
      totalSessions: employee.totalSessions,
      averageHoursPerSession: employee.totalSessions > 0 ? 
        Math.round((employee.totalHours / employee.totalSessions) * 100) / 100 : 0,
      branches: Array.from(employee.branches),
      status: employee.status,
      lastCheckIn: employee.lastCheckIn
    }))

    // Sort by last check-in time (most recent first)
    employeeReports.sort((a, b) => {
      // If both have lastCheckIn, sort by most recent
      if (a.lastCheckIn && b.lastCheckIn) {
        return new Date(b.lastCheckIn).getTime() - new Date(a.lastCheckIn).getTime()
      }
      // If only one has lastCheckIn, prioritize it
      if (a.lastCheckIn && !b.lastCheckIn) return -1
      if (!a.lastCheckIn && b.lastCheckIn) return 1
      // If neither has lastCheckIn, sort by total hours as fallback
      return b.totalHours - a.totalHours
    })

    console.log('Final employee reports count:', employeeReports.length)
    console.log('Sample employee report:', employeeReports[0])

    // Calculate summary statistics
    const summary = {
      totalEmployees: employeeReports.length,
      totalHours: employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0),
      activeEmployees: employeeReports.filter(emp => emp.status === 'working').length,
      averageHoursPerEmployee: employeeReports.length > 0 ? 
        Math.round((employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0) / employeeReports.length) * 100) / 100 : 0
    }

    console.log('Summary statistics:', summary)

    // Include helpful hint during development when service role is missing (RLS may cause empty results)
    const hint = !config.supabase.serviceRoleKey
      ? 'Warning: SUPABASE_SERVICE_ROLE_KEY not configured. Admin reports will be restricted by RLS and may show 0 employees.'
      : undefined

    return NextResponse.json({
      success: true,
      data: {
        summary,
        employees: employeeReports,
        dateRange: {
          type: dateRange,
          startDate: startDate || computedStartDate,
          endDate: endDate || computedEndDate
        }
      },
      hint
    })

  } catch (error) {
    console.error('GET /api/admin/reports/employees error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
