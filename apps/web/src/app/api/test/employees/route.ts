import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Test employees API called')
    
    const adminClient = await createSupabaseServerClient()
    
    // Simple test query
    const { data: timeEntries, error } = await adminClient
      .from('time_entries')
      .select('*')
      .limit(5)
    
    console.log('Time entries result:', { count: timeEntries?.length || 0, error })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        timeEntries: timeEntries || [],
        count: timeEntries?.length || 0
      }
    })
    
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}