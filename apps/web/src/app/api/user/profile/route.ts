import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { config } from '@employee-management/config'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    if (!config.supabase.serviceRoleKey) {
      console.warn('Profile API: SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon key; RLS may block selecting users row.')
    }
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Profile API: No authorization header')
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - Please login first',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Get authenticated user first
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.warn('Profile API: Authentication failed', { 
        authError: authError?.message,
        hasUser: !!user 
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - Please login first',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      )
    }

    // Get user profile from users table with branch information using service role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        branch_id,
        employee_id,
        phone_number,
        hire_date,
        is_active,
        created_at,
        branch:branches (
          id,
          name
        )
      `)
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Profile API: Database error fetching user profile', {
        userId: user.id,
        error: profileError.message,
        code: profileError.code
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch user profile',
          code: 'DATABASE_ERROR',
          details: process.env.NODE_ENV === 'development' ? profileError.message : undefined,
          hint: !config.supabase.serviceRoleKey ? 'Missing SUPABASE_SERVICE_ROLE_KEY may cause RLS denial' : undefined
        }, 
        { status: 500 }
      )
    }

    if (!profile) {
      // User exists in auth but not in users table
      console.warn('Profile API: User profile not found in database', {
        userId: user.id,
        userEmail: user.email
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'User profile not found', 
          message: 'User authenticated but profile not created yet',
          code: 'PROFILE_NOT_FOUND',
          userId: user.id
        }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('Profile API: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      }, 
      { status: 500 }
    )
  }
}
