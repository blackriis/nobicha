import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Simple join API called')
    
    const adminClient = await createSupabaseServerClient()
    
    // Test 1: Get users directly
    console.log('Step 1: Testing users query...')
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id, full_name, employee_id')
    
    console.log('Users result:', { count: users?.length || 0, error: usersError })
    
    // Test 2: Get time entries directly  
    console.log('Step 2: Testing time entries query...')
    const { data: timeEntries, error: timeError } = await adminClient
      .from('time_entries')
      .select('id, user_id, total_hours')
      .limit(5)
    
    console.log('Time entries result:', { count: timeEntries?.length || 0, error: timeError })
    
    // Test 3: Manual join
    console.log('Step 3: Manual join...')
    if (users && timeEntries) {
      const usersMap = new Map(users.map(user => [user.id, user]))
      
      const joined = timeEntries.map(entry => ({
        ...entry,
        user: usersMap.get(entry.user_id)
      }))
      
      const validEntries = joined.filter(entry => entry.user)
      
      console.log('Join result:', {
        totalEntries: joined.length,
        validEntries: validEntries.length,
        sample: validEntries[0]
      })
      
      return NextResponse.json({
        success: true,
        data: {
          users: { count: users.length, data: users },
          timeEntries: { count: timeEntries.length, data: timeEntries },
          joined: { count: validEntries.length, data: validEntries }
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'No data found',
      data: {
        users: { count: users?.length || 0, error: usersError },
        timeEntries: { count: timeEntries?.length || 0, error: timeError }
      }
    })
    
  } catch (error) {
    console.error('Simple join API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}