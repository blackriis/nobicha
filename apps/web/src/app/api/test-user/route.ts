import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config as appConfig } from '@employee-management/config'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password required' 
      }, { status: 400 })
    }

    const supabase = createClient(
      appConfig.supabase.url,
      appConfig.supabase.serviceRoleKey
    )

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: role || 'employee',
        full_name: email.split('@')[0]
      }
    })

    if (authError) {
      return NextResponse.json({ 
        error: authError.message 
      }, { status: 400 })
    }

    // Create profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: authData.user.user_metadata?.full_name || '',
          role: authData.user.user_metadata?.role || 'employee',
          created_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        role: authData.user?.user_metadata?.role
      }
    })

  } catch (error) {
    console.error('Test user creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}