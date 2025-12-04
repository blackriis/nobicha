import { NextRequest, NextResponse } from 'next/server'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'
import { authRateLimiter } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Admin Time Entries API Called ===')
    console.log('Request URL:', request.url)
    
    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      console.log('⚠️ Rate limit exceeded for time entries API')
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check (cookie-based)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔐 Auth status:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    })

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    // Get user profile and check role using service role client to bypass RLS
    const adminClient = createSupabaseServerClient()
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile as { role: string }).role !== 'admin') {
      console.log('❌ Access denied - Admin role required')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('✅ Admin access verified, fetching time entries...')
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const branchFilter = searchParams.get('branch')
    const statusFilter = searchParams.get('status')
    const searchTerm = searchParams.get('search')
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    console.log('Fetching all time entries with filters:', {
      limit,
      branchFilter,
      statusFilter,
      searchTerm,
      fromDate,
      toDate
    })

    // Query time entries without joins to avoid schema cache issues
    let query = adminClient
      .from('time_entries')
      .select(`
        id,
        user_id,
        branch_id,
        check_in_time,
        check_out_time,
        break_duration,
        total_hours,
        notes,
        created_at,
        check_in_selfie_url,
        check_out_selfie_url
      `)
      .order('check_in_time', { ascending: false })
      .limit(limit)

    // Apply branch filter if specified
    if (branchFilter && branchFilter !== 'all') {
      query = query.eq('branch_id', branchFilter)
    }

    // Apply status filter if specified
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        query = query.not('check_out_time', 'is', null)
      } else if (statusFilter === 'in_progress') {
        query = query.is('check_out_time', null)
      } else if (statusFilter === 'incomplete') {
        query = query.is('check_out_time', null)
      }
    }

    // Apply date range filter if specified
    if (fromDate) {
      query = query.gte('check_in_time', fromDate)
    }
    if (toDate) {
      // Add one day to include the entire toDate
      const toDatePlusOne = new Date(toDate)
      toDatePlusOne.setDate(toDatePlusOne.getDate() + 1)
      query = query.lt('check_in_time', toDatePlusOne.toISOString())
    }

    console.log('Executing Supabase query for time entries...')
    const { data: timeEntries, error: timeEntriesError } = await query

    console.log('Time entries query completed. Data:', timeEntries?.length || 0, 'entries')
    
    if (timeEntriesError) {
      console.error('❌ Time entries fetch error:', timeEntriesError)
      console.error('Error details:', JSON.stringify(timeEntriesError, null, 2))
      
      let errorMessage = 'Failed to fetch time entries'
      if (timeEntriesError.code === 'PGRST116') {
        errorMessage = 'No time entries found'
      } else if (timeEntriesError.message) {
        errorMessage = `Failed to fetch time entries: ${timeEntriesError.message}`
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: timeEntriesError.message,
          code: timeEntriesError.code
        },
        { status: 500 }
      )
    }

    // Fetch users and branches separately to avoid schema cache issues
    const userIds = [...new Set((timeEntries || []).map(entry => entry.user_id).filter(Boolean))]
    const branchIds = [...new Set((timeEntries || []).map(entry => entry.branch_id).filter(Boolean))]

    // Fetch users data
    let userMap = new Map()
    if (userIds.length > 0) {
      console.log('Fetching user data for', userIds.length, 'users...')
      const { data: users, error: usersError } = await adminClient
        .from('users')
        .select('id, full_name, employee_id')
        .in('id', userIds)

      if (usersError) {
        console.error('Users query error:', usersError)
        // Continue without user data rather than failing
      } else {
        userMap = new Map(users?.map(u => [u.id, u]) || [])
        console.log('User data fetched:', userMap.size, 'users')
      }
    }

    // Fetch branches data
    let branchMap = new Map()
    if (branchIds.length > 0) {
      console.log('Fetching branch data for', branchIds.length, 'branches...')
      const { data: branches, error: branchError } = await adminClient
        .from('branches')
        .select('id, name, address, latitude, longitude')
        .in('id', branchIds)

      if (branchError) {
        console.error('Branch query error:', branchError)
        // Continue without branch data rather than failing
      } else {
        branchMap = new Map(branches?.map(b => [b.id, b]) || [])
        console.log('Branch data fetched:', branchMap.size, 'branches')
      }
    }

    // Transform data to match frontend interface
    const transformedEntries = (timeEntries || []).map((entry: any) => {
      const user = entry.user_id ? userMap.get(entry.user_id) : null
      const branch = entry.branch_id ? branchMap.get(entry.branch_id) : null
      
      return {
        id: entry.id,
        userId: entry.user_id,
        employeeId: user?.employee_id || 'N/A',
        employeeName: user?.full_name || 'Unknown',
        branchName: branch?.name || 'Unknown Branch',
        checkInTime: entry.check_in_time,
        checkOutTime: entry.check_out_time,
        totalHours: entry.total_hours || 0,
        status: entry.check_out_time ? 'completed' : 'in_progress',
        checkInSelfieUrl: entry.check_in_selfie_url,
        checkOutSelfieUrl: entry.check_out_selfie_url,
        latitude: branch?.latitude || null,
        longitude: branch?.longitude || null
      }
    })

    console.log('Transformed entries:', transformedEntries.length)

    // Apply search filter if specified (client-side for now)
    let filteredEntries = transformedEntries
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filteredEntries = transformedEntries.filter(entry =>
        entry.employeeName.toLowerCase().includes(searchLower) ||
        entry.employeeId.toLowerCase().includes(searchLower) ||
        entry.branchName.toLowerCase().includes(searchLower)
      )
    }

    // If no data found, return empty array instead of error
    const responseData = {
      success: true,
      data: filteredEntries,
      total: filteredEntries.length,
      filters: {
        branch: branchFilter,
        status: statusFilter,
        search: searchTerm
      }
    }

    console.log('Final response:', responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ Admin time entries API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
