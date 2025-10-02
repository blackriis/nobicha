import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isValidUUID } from '@/lib/validation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    // Check authentication and admin role
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'ไม่พบการยืนยันตัวตน' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'การยืนยันตัวตนไม่ถูกต้อง' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' }, { status: 403 })
    }

    const { data: employee, error } = await supabase
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
        branches:branch_id(id,name,address)
      `)
      .eq('id', employeeId)
      .single()

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

    return NextResponse.json({ employee })
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

    // Check authentication and admin role
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'ไม่พบการยืนยันตัวตน' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'การยืนยันตัวตนไม่ถูกต้อง' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' }, { status: 403 })
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
    const { data: existingUser } = await supabase
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
      const { data: branch } = await supabase
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
    const { data: updatedEmployee, error: updateError } = await supabase
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
        created_at,
        branches:branch_id(id,name,address)
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

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว',
      employee: updatedEmployee
    })

  } catch (error) {
    console.error('Unexpected error in update employee API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}