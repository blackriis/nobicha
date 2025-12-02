import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('=== Admin Time Entries API Called ===')
    console.log('Request URL:', request.url)
    
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

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Build query
    let query = supabase
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
        check_out_selfie_url,
        branches!time_entries_branch_id_fkey (
          id,
          name,
          address
        ),
        users:user_id (
          id,
          full_name,
          employee_id
        )
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

    console.log('Executing Supabase query...')
    const { data: timeEntries, error } = await query

    console.log('Query completed. Data:', timeEntries?.length || 0, 'entries')
    console.log('Error:', error)

    if (error) {
      console.error('Time entries fetch error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to fetch time entries', details: error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend interface
    const transformedEntries = (timeEntries || []).map((entry: any) => ({
      id: entry.id,
      userId: entry.user_id,
      employeeId: entry.users?.employee_id || 'N/A',
      employeeName: entry.users?.full_name || 'Unknown',
      branchName: entry.branches?.name || 'Unknown Branch',
      checkInTime: entry.check_in_time,
      checkOutTime: entry.check_out_time,
      totalHours: entry.total_hours || 0,
      status: entry.check_out_time ? 'completed' : 'in_progress',
      checkInSelfieUrl: entry.check_in_selfie_url,
      checkOutSelfieUrl: entry.check_out_selfie_url,
      latitude: entry.branches?.latitude,
      longitude: entry.branches?.longitude
    }))

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
    console.error('Admin time entries API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
