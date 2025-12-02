import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limit'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/admin/branches - Get list of branches for filtering
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin Branches API called:', {
      url: request.url,
      method: request.method
    })

    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      console.log('⚠️ Rate limit exceeded for branches API')
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check (cookie-based)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔐 Auth status:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    })

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    // Get user profile and check role using service role client to bypass RLS
    const adminClient = createSupabaseServerClient()
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile as { role: string }).role !== 'admin') {
      console.log('❌ Access denied - Admin role required')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('✅ Admin access verified, fetching branches...')

    // Get branches
    const { data: branches, error } = await adminClient
      .from('branches')
      .select('id, name, address, latitude, longitude')
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ Error fetching branches:', error)
      return NextResponse.json(
        { error: 'Failed to fetch branches', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Branches fetched successfully:', {
      count: branches?.length || 0,
      branches: branches?.map(b => ({ id: b.id, name: b.name }))
    })

    return NextResponse.json({
      success: true,
      branches: branches || []
    })

  } catch (error) {
    console.error('❌ Branches API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/branches - Create new branch
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Admin Create Branch API called:', {
      url: request.url,
      method: request.method
    })

    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      console.log('⚠️ Rate limit exceeded for create branch API')
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check (cookie-based)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    // Get user profile and check role using service role client to bypass RLS
    const adminClient = createSupabaseServerClient()
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile as { role: string }).role !== 'admin') {
      console.log('❌ Access denied - Admin role required')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, address, latitude, longitude } = body

    // Validate required fields
    if (!name || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, latitude, longitude' },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Latitude and longitude must be numbers' },
        { status: 400 }
      )
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      )
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      )
    }

    console.log('✅ Admin access verified, creating branch...', { name, address, latitude, longitude })

    // Create new branch
    const { data: newBranch, error } = await adminClient
      .from('branches')
      .insert({
        name,
        address,
        latitude,
        longitude
      })
      .select('id, name, address, latitude, longitude')
      .single()

    if (error) {
      console.error('❌ Error creating branch:', error)
      return NextResponse.json(
        { error: 'Failed to create branch', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Branch created successfully:', newBranch)

    return NextResponse.json({
      success: true,
      branch: newBranch
    })

  } catch (error) {
    console.error('❌ Create Branch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}