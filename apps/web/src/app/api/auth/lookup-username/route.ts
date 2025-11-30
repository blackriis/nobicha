import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@employee-management/database'
import { config } from '@employee-management/config'

// Create admin client for user lookup (bypasses RLS)
function createAdminClient() {
  const supabaseUrl = config.supabase.url
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Username is required',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      )
    }

    // Use admin client to lookup username
    const supabase = createAdminClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle()

    if (error) {
      console.error('Username lookup error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to lookup username',
          code: 'LOOKUP_FAILED'
        },
        { status: 500 }
      )
    }

    if (!user) {
      // Don't reveal if username exists or not for security
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      email: user.email
    })

  } catch (error) {
    console.error('Username lookup exception:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
