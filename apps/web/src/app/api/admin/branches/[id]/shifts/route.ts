import { NextRequest, NextResponse } from 'next/server'
import { workShiftService } from '@/lib/services/workshift.service'
import { authRateLimiter } from '@/lib/rate-limit'
import { validateRequestBody } from '@/lib/validation'
import { createClient } from '@/lib/supabase-server'

interface RouteParams {
  params: {
    id: string // branch id
  }
}

// GET /api/admin/branches/[id]/shifts - Get all shifts for a branch
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params before using
    const { id } = await params
    
    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile and check role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch shifts for the branch
    const result = await workShiftService.getShiftsByBranchId(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error(`GET /api/admin/branches/${id}/shifts error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/branches/[id]/shifts - Create new shift for a branch
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params before using
    const { id } = await params
    
    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile and check role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate required fields
    const validation = validateRequestBody(body, ['name', 'start_time'])
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Create work shift
    const result = await workShiftService.createWorkShift({
      branch_id: id,
      shift_name: body.name,
      start_time: body.start_time,
      end_time: body.end_time || '17:00', // Default end time if not provided
      days_of_week: body.days_of_week || [1, 2, 3, 4, 5] // Default weekdays if not provided
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 })

  } catch (error) {
    console.error(`POST /api/admin/branches/${id}/shifts error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
