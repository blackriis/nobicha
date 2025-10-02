import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Debug API called')
    
    const adminClient = await createSupabaseServerClient()
    
    // Get time entries
    const { data: timeEntries, error: timeError } = await adminClient
      .from('time_entries')
      .select('*')
      .limit(5)
    
    console.log('Time entries:', { count: timeEntries?.length || 0, error: timeError })
    
    // Get all users
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('*')
      .limit(10)
    
    console.log('Users:', { count: users?.length || 0, error: usersError })
    
    // Get all branches
    const { data: branches, error: branchesError } = await adminClient
      .from('branches')
      .select('*')
      .limit(10)
    
    console.log('Branches:', { count: branches?.length || 0, error: branchesError })
    
    // Check specific user IDs from time entries
    if (timeEntries && timeEntries.length > 0) {
      const userIds = timeEntries.map(entry => entry.user_id)
      const branchIds = timeEntries.map(entry => entry.branch_id)
      
      console.log('User IDs from time_entries:', userIds)
      console.log('Branch IDs from time_entries:', branchIds)
      
      // Check if these users exist
      const { data: specificUsers, error: specificUsersError } = await adminClient
        .from('users')
        .select('*')
        .in('id', userIds)
      
      console.log('Specific users found:', { count: specificUsers?.length || 0, error: specificUsersError })
      
      // Check if these branches exist
      const { data: specificBranches, error: specificBranchesError } = await adminClient
        .from('branches')
        .select('*')
        .in('id', branchIds)
      
      console.log('Specific branches found:', { count: specificBranches?.length || 0, error: specificBranchesError })
      
      return NextResponse.json({
        success: true,
        data: {
          timeEntries: {
            count: timeEntries?.length || 0,
            sample: timeEntries?.[0],
            userIds,
            branchIds
          },
          users: {
            total: users?.length || 0,
            specific: specificUsers?.length || 0,
            specificData: specificUsers
          },
          branches: {
            total: branches?.length || 0,
            specific: specificBranches?.length || 0,
            specificData: specificBranches
          }
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        timeEntries: { count: timeEntries?.length || 0 },
        users: { count: users?.length || 0 },
        branches: { count: branches?.length || 0 }
      }
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}