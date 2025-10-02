import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { TimeEntry } from '@/../../packages/database/types'

type DateRangeFilter = 'today' | 'week' | 'month'

interface TimeEntryWithBranch extends TimeEntry {
  branch: {
    id: string
    name: string
    latitude: number
    longitude: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') as DateRangeFilter || 'today'

    // Calculate date filter based on range
    let dateFilter: string
    const now = new Date()
    
    switch (dateRange) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        dateFilter = today.toISOString()
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = weekAgo.toISOString()
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = monthAgo.toISOString()
        break
      default:
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    }

    // Build query based on date range
    let query = supabase
      .from('time_entries')
      .select(`
        id,
        user_id,
        branch_id,
        check_in_time,
        check_out_time,
        total_hours,
        notes,
        created_at,
        branches:branch_id (
          id,
          name,
          latitude,
          longitude
        )
      `)
      .eq('user_id', user.id)
      .order('check_in_time', { ascending: false })
      .limit(100)

    // Apply date filter based on range type
    if (dateRange === 'today') {
      // For today, get entries where check_in_time is on current date
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      query = query
        .gte('check_in_time', dateFilter)
        .lt('check_in_time', tomorrow.toISOString())
    } else {
      // For week/month, get entries since the calculated date
      query = query.gte('check_in_time', dateFilter)
    }

    const { data: timeEntries, error: queryError } = await query

    if (queryError) {
      console.error('Time entries history query error:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch time entries history' },
        { status: 500 }
      )
    }

    // Transform data to match expected interface
    // Note: Exclude sensitive selfie_url for privacy and performance in history view
    const formattedEntries: TimeEntryWithBranch[] = (timeEntries || []).map(entry => ({
      id: entry.id,
      user_id: entry.user_id,
      branch_id: entry.branch_id,
      check_in_time: entry.check_in_time,
      check_out_time: entry.check_out_time,
      // Intentionally omit selfie_url for history list view (not needed for display)
      break_duration: entry.break_duration || 0,
      total_hours: entry.total_hours,
      notes: entry.notes,
      created_at: entry.created_at,
      branch: {
        id: entry.branches?.id || entry.branch_id,
        name: entry.branches?.name || 'ไม่ระบุสาขา',
        latitude: entry.branches?.latitude || 0,
        longitude: entry.branches?.longitude || 0
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedEntries,
      dateRange,
      totalCount: formattedEntries.length
    })

  } catch (error) {
    console.error('Time entries history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}