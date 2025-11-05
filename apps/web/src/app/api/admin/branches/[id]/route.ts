import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase-server'
import { validateGPSCoordinates } from '@/lib/utils/gps.utils'
import type { Database } from '@employee-management/database'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/branches/[id] - Get branch by ID
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    // Await params before using (Next.js 15 requires params to be a Promise)
    const { id } = await context.params
    
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

    // Fetch branch by ID
    const { data: branch, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching branch:', error)
      return NextResponse.json(
        { error: error.code === 'PGRST116' ? 'ไม่พบสาขาที่ต้องการ' : 'ไม่สามารถดึงข้อมูลสาขาได้' },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: branch
    })

  } catch (error) {
    console.error(`GET /api/admin/branches/${id} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/branches/[id] - Update branch
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    // Await params before using (Next.js 15 requires params to be a Promise)
    const { id } = await context.params
    
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

    // Validate input data
    if (body.name && typeof body.name === 'string' && body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อสาขา' },
        { status: 400 }
      )
    }

    if (body.address && typeof body.address === 'string' && body.address.trim().length === 0) {
      return NextResponse.json(
        { error: 'กรุณากรอกที่อยู่สาขา' },
        { status: 400 }
      )
    }

    // Validate GPS coordinates if provided
    if (body.latitude !== undefined && body.longitude !== undefined) {
      const gpsValidation = validateGPSCoordinates(
        parseFloat(body.latitude), 
        parseFloat(body.longitude)
      )
      if (!gpsValidation.valid) {
        return NextResponse.json(
          { error: `พิกัด GPS ไม่ถูกต้อง: ${gpsValidation.errors.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.address !== undefined) updateData.address = body.address.trim()
    if (body.latitude !== undefined) updateData.latitude = parseFloat(body.latitude)
    if (body.longitude !== undefined) updateData.longitude = parseFloat(body.longitude)

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    // Check for duplicate name if updating name
    if (updateData.name) {
      const { data: existingBranch } = await supabase
        .from('branches')
        .select('id')
        .eq('name', updateData.name)
        .neq('id', id)
        .single()

      if (existingBranch) {
        return NextResponse.json(
          { error: 'ชื่อสาขานี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        )
      }
    }

    // Update branch
    const { data: updatedBranch, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating branch:', error)
      return NextResponse.json(
        { error: error.code === 'PGRST116' ? 'ไม่พบสาขาที่ต้องการแก้ไข' : 'ไม่สามารถแก้ไขข้อมูลสาขาได้' },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedBranch
    })

  } catch (error) {
    console.error(`PUT /api/admin/branches/${id} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/branches/[id] - Delete branch
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    // Await params before using (Next.js 15 requires params to be a Promise)
    const { id } = await context.params
    
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

    // Check if branch has associated work shifts
    const { data: shifts } = await supabase
      .from('work_shifts')
      .select('id')
      .eq('branch_id', id)
      .limit(1)

    if (shifts && shifts.length > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบสาขาได้ เนื่องจากมีการกำหนดกะการทำงานไว้' },
        { status: 400 }
      )
    }

    // Check if branch has associated employees
    const { data: employees } = await supabase
      .from('users')
      .select('id')
      .eq('branch_id', id)
      .limit(1)

    if (employees && employees.length > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบสาขาได้ เนื่องจากมีพนักงานที่สังกัดสาขานี้' },
        { status: 400 }
      )
    }

    // Check if branch has time entries
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('id')
      .eq('branch_id', id)
      .limit(1)

    if (timeEntries && timeEntries.length > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบสาขาได้ เนื่องจากมีการบันทึกเวลาทำงานในสาขานี้' },
        { status: 400 }
      )
    }

    // Delete branch
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting branch:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถลบสาขาได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Branch deleted successfully'
    })

  } catch (error) {
    console.error(`DELETE /api/admin/branches/${id} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
