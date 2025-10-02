import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - Please login first',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Profile already exists',
          code: 'PROFILE_EXISTS'
        }, 
        { status: 409 }
      )
    }

    // Get request body for profile data
    const body = await request.json()
    const { full_name, role = 'employee', branch_id, employee_id, phone_number } = body

    // Create user profile
    const { data: profile, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: full_name || user.user_metadata?.full_name || '',
        role: role,
        branch_id: branch_id || null,
        employee_id: employee_id || null,
        phone_number: phone_number || null,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Profile creation error:', {
        userId: user.id,
        error: insertError.message,
        code: insertError.code
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create user profile',
          code: 'DATABASE_ERROR',
          details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
        }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile,
      message: 'Profile created successfully'
    })

  } catch (error) {
    console.error('Profile creation API: Unexpected error', {
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
