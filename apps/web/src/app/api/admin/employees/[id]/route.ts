import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limit'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'
import { isValidUUID } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeId } = await params

    // Validate UUID format
    if (!isValidUUID(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID format' },
        { status: 400 }
      )
    }

    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check - support both Bearer token and cookie-based auth
    const authHeader = request.headers.get('authorization')
    let user = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use bearer token authentication (for backward compatibility)
      const token = authHeader.replace('Bearer ', '')
      const tempSupabase = await createSupabaseServerClient()
      const { data: userData, error: tokenError } = await tempSupabase.auth.getUser(token)
      if (tokenError || !userData.user) {
        return NextResponse.json(
          { error: 'ไม่พบการยืนยันตัวตน' },
          { status: 401 }
        )
      }
      user = userData.user
    } else {
      // Fallback to cookie-based auth (preferred for production)
      const supabase = await createClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !cookieUser) {
        return NextResponse.json(
          { error: 'ไม่พบการยืนยันตัวตน' },
          { status: 401 }
        )
      }
      user = cookieUser
    }

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบการยืนยันตัวตน' },
        { status: 401 }
      )
    }

    // Get user profile and check role using service role client to bypass RLS
    const adminClient = await createSupabaseServerClient()
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    // Fetch employee data first
    const { data: employee, error } = await adminClient
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
        hourly_rate,
        daily_rate,
        created_at
      `)
      .eq('id', employeeId)
      .single()

    console.log('GET employee query result:', {
      employeeId,
      hasError: !!error,
      hasEmployee: !!employee,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details
      } : null
    })

    if (error) {
      console.error('Get employee by ID error (API):', {
        message: error?.message || 'No message',
        code: error?.code || 'No code',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint',
        employeeId
      })

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch employee data' },
        { status: 500 }
      )
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Fetch branch data separately if branch_id exists
    let branchData = null
    if ((employee as any).branch_id) {
      const { data: branch } = await adminClient
        .from('branches')
        .select('id, name, address')
        .eq('id', (employee as any).branch_id)
        .single()

      branchData = branch
      console.log('Branch data fetched:', { branchId: (employee as any).branch_id, hasBranch: !!branch })
    }

    // Format the response to match EmployeeDetail interface
    const employeeData = employee as any
    const formattedEmployee = {
      ...employeeData,
      branch_name: branchData?.name || null,
      branches: branchData?.name || null
    }

    console.log('Final formatted employee:', {
      id: formattedEmployee.id,
      email: formattedEmployee.email,
      branch_id: formattedEmployee.branch_id,
      branch_name: formattedEmployee.branch_name,
      branches: formattedEmployee.branches
    })

    return NextResponse.json({ employee: formattedEmployee })
  } catch (error) {
    console.error('Unexpected error in employee API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeId } = await params

    // Validate UUID format
    if (!isValidUUID(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID format' },
        { status: 400 }
      )
    }

    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check - support both Bearer token and cookie-based auth
    const authHeader = request.headers.get('authorization')
    let user = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use bearer token authentication (for backward compatibility)
      const token = authHeader.replace('Bearer ', '')
      const tempSupabase = await createSupabaseServerClient()
      const { data: userData, error: tokenError } = await tempSupabase.auth.getUser(token)
      if (tokenError || !userData.user) {
        return NextResponse.json(
          { error: 'ไม่พบการยืนยันตัวตน' },
          { status: 401 }
        )
      }
      user = userData.user
    } else {
      // Fallback to cookie-based auth (preferred for production)
      const supabase = await createClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !cookieUser) {
        return NextResponse.json(
          { error: 'ไม่พบการยืนยันตัวตน' },
          { status: 401 }
        )
      }
      user = cookieUser
    }

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบการยืนยันตัวตน' },
        { status: 401 }
      )
    }

    // Get user profile and check role using service role client to bypass RLS
    const adminClient = await createSupabaseServerClient()
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    // Parse request body
    const updateData = await request.json()

    // Validate required fields
    if (!updateData.full_name || !updateData.email) {
      return NextResponse.json({
        success: false,
        error: 'ชื่อและอีเมลเป็นข้อมูลที่จำเป็น'
      }, { status: 400 })
    }

    // Check if email already exists (excluding current employee)
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('email', updateData.email)
      .neq('id', employeeId)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'อีเมลนี้มีอยู่ในระบบแล้ว'
      }, { status: 409 })
    }

    // Check if branch exists (if branch_id is provided)
    if (updateData.branch_id) {
      const { data: branch } = await adminClient
        .from('branches')
        .select('id')
        .eq('id', updateData.branch_id)
        .single()

      if (!branch) {
        return NextResponse.json({
          success: false,
          error: 'ไม่พบสาขาที่เลือก'
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateFields: any = {
      full_name: updateData.full_name.trim(),
      email: updateData.email.trim(),
      phone_number: updateData.phone_number || null,
      hire_date: updateData.hire_date || null,
      is_active: updateData.is_active !== undefined ? updateData.is_active : true
    }

    // Add branch_id if provided
    if (updateData.branch_id) {
      updateFields.branch_id = updateData.branch_id
    }

    // Add hourly_rate and daily_rate if provided
    if (updateData.hourly_rate !== undefined) {
      updateFields.hourly_rate = updateData.hourly_rate
    }
    if (updateData.daily_rate !== undefined) {
      updateFields.daily_rate = updateData.daily_rate
    }

    // Update employee in database
    const { data: updatedEmployee, error: updateError } = await adminClient
      .from('users')
      .update(updateFields)
      .eq('id', employeeId)
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
        hourly_rate,
        daily_rate,
        created_at
      `)
      .single()

    if (updateError) {
      console.error('Update employee error:', updateError)
      return NextResponse.json({
        success: false,
        error: 'ไม่สามารถอัปเดตข้อมูลพนักงานได้'
      }, { status: 500 })
    }

    if (!updatedEmployee) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบข้อมูลพนักงานรายการนี้'
      }, { status: 404 })
    }

    // Fetch branch data separately if branch_id exists
    let branchData = null
    if ((updatedEmployee as any).branch_id) {
      const { data: branch } = await adminClient
        .from('branches')
        .select('id, name, address')
        .eq('id', (updatedEmployee as any).branch_id)
        .single()

      branchData = branch
    }

    // Format the response to match EmployeeDetail interface
    const employeeData = updatedEmployee as any
    const formattedEmployee = {
      ...employeeData,
      branch_name: branchData?.name || null,
      branches: branchData?.name || null
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว',
      employee: formattedEmployee
    })

  } catch (error) {
    console.error('Unexpected error in update employee API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}