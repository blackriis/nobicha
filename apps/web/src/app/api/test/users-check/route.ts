import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const adminClient = await createSupabaseServerClient()
    
    // Get all users
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('*')
    
    // Get user IDs from time_entries
    const { data: timeEntries, error: timeError } = await adminClient
      .from('time_entries')
      .select('user_id')
      .limit(10)
    
    const timeEntryUserIds = timeEntries?.map(entry => entry.user_id) || []
    const uniqueTimeEntryUserIds = [...new Set(timeEntryUserIds)]
    
    return NextResponse.json({
      success: true,
      data: {
        allUsers: users || [],
        userCount: users?.length || 0,
        timeEntryUserIds: uniqueTimeEntryUserIds,
        mismatch: {
          usersInTimeEntries: uniqueTimeEntryUserIds,
          usersInUsersTable: users?.map(u => u.id) || [],
          missingUsers: uniqueTimeEntryUserIds.filter(id => 
            !users?.some(user => user.id === id)
          )
        }
      }
    })
    
  } catch (error) {
    console.error('Users check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}