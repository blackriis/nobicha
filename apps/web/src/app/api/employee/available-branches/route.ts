import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/lib/services/location.service'
import { generalRateLimiter } from '@/lib/rate-limit'
import { validateRequestBody } from '@/lib/validation'
import { createClient } from '@/lib/supabase-server'

// POST /api/employee/available-branches - Get available branches for employee check-in
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await generalRateLimiter.checkLimit(request)
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

    // Get user profile and check role (employees only)
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'employee') {
      return NextResponse.json(
        { error: 'Employee access required' },
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
    const validation = validateRequestBody(body, ['latitude', 'longitude'])
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Validate GPS coordinates
    const latitude = parseFloat(body.latitude)
    const longitude = parseFloat(body.longitude)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid GPS coordinates' },
        { status: 400 }
      )
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'GPS coordinates out of valid range' },
        { status: 400 }
      )
    }

    // Get radius from query params (default 100 meters)
    const url = new URL(request.url)
    const radiusParam = url.searchParams.get('radius')
    const radius = radiusParam ? parseInt(radiusParam) : 100

    if (isNaN(radius) || radius < 1 || radius > 10000) {
      return NextResponse.json(
        { error: 'Radius must be between 1 and 10000 meters' },
        { status: 400 }
      )
    }

    // Get available branches for employee
    const result = await locationService.getAvailableBranchesForEmployee(
      user.id,
      { latitude, longitude },
      radius
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    const data = result.data!

    return NextResponse.json({
      success: true,
      data: {
        home_branch: data.homeBranch,
        nearby_branches: data.nearbyBranches,
        can_check_in_branches: data.canCheckInBranches,
        check_in_allowed: data.canCheckInBranches.length > 0,
        radius_meters: radius,
        user_location: {
          latitude,
          longitude
        }
      }
    })

  } catch (error) {
    console.error('POST /api/employee/available-branches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/employee/available-branches - Get available branches without location (for UI initial load)
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await generalRateLimiter.checkLimit(request)
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

    // Get user profile and check role (employees only)
    const { data: userProfile } = await supabase
      .from('users')
      .select(`
        role,
        branch_id,
        home_branch:branches!users_branch_id_fkey (*)
      `)
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'employee') {
      return NextResponse.json(
        { error: 'Employee access required' },
        { status: 403 }
      )
    }

    // Get all branches for display purposes (employee can check-in to any if in range)
    const { data: allBranches, error: branchesError } = await supabase
      .from('branches')
      .select('*')
      .order('name', { ascending: true })

    if (branchesError) {
      console.error('Error fetching branches:', branchesError)
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลสาขาได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        home_branch: userProfile.home_branch,
        all_branches: allBranches || [],
        message: 'กรุณาเปิดการเข้าถึงตำแหน่งเพื่อตรวจสอบสาขาที่สามารถลงเวลาได้'
      }
    })

  } catch (error) {
    console.error('GET /api/employee/available-branches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}