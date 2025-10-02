import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/lib/services/location.service'
import { publicRateLimiter } from '@/lib/rate-limit'
import { validateRequestBody } from '@/lib/validation'
import { createClient } from '@/lib/supabase-server'

// POST /api/location/nearby-branches - Find branches near user location
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await publicRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too Many Requests',
          message: 'การร้องขอเกินขีดจำกัด กรุณาลองใหม่อีกครั้งในสักครู่',
          messageEn: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Authentication check
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Find nearby branches
    const result = await locationService.findNearbyBranches(
      { latitude, longitude },
      radius
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        branches: result.data,
        radius_meters: radius,
        user_location: {
          latitude,
          longitude
        }
      }
    })

  } catch (error) {
    console.error('POST /api/location/nearby-branches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
