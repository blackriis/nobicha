import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    console.log('Testing database connection...')
    
    // Test basic connection with service role
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .limit(5)
    
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name, latitude, longitude')
      .limit(5)
    
    const error = userError || branchError
    
    if (error) {
      console.error('Database error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      }, { status: 500 })
    }
    
    console.log('Database connection successful!')
    console.log('Sample users:', users)
    console.log('Sample branches:', branches)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        users: users || [],
        branches: branches || [],
        users_count: users?.length || 0,
        branches_count: branches?.length || 0
      }
    })
    
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR'
      }
    }, { status: 500 })
  }
}
