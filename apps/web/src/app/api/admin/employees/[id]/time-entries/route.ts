import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isValidUUID } from '@/lib/validation'

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeId } = await params

    // Validate employee ID
    if (!employeeId || typeof employeeId !== 'string') {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    if (!isValidUUID(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID format' },
        { status: 400 }
      )
    }

    console.log(`Fetching time entries for employee: ${employeeId}`)

    // Get time entries for the employee with branch information
    console.log('Executing Supabase query...')
    const { data: timeEntries, error } = await supabase
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
        branches:branch_id (
          id,
          name,
          address
        )
      `)
      .eq('user_id', employeeId)
      .order('check_in_time', { ascending: false })
      .limit(100) // Limit to recent 100 entries

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
    const transformedEntries = (timeEntries || []).map(entry => ({
      id: entry.id,
      user_id: entry.user_id,
      branch_id: entry.branch_id,
      branch_name: entry.branches?.name || null,
      check_in_time: entry.check_in_time,
      check_out_time: entry.check_out_time,
      status: entry.check_out_time ? 'completed' : 'incomplete', // Derive status from check_out_time
      selfie_url: entry.selfie_url,
      check_in_selfie_url: entry.check_in_selfie_url,
      check_out_selfie_url: entry.check_out_selfie_url,
      break_duration: entry.break_duration || 0,
      total_hours: entry.total_hours || 0,
      notes: entry.notes,
      created_at: entry.created_at
    }))

    return NextResponse.json({
      success: true,
      data: transformedEntries,
      total: transformedEntries.length
    })

  } catch (error) {
    console.error('Admin time entries API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
