import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SearchFilters, PaginationParams, EmployeeListResponse, EmployeeListItem } from '@/lib/services/employee.service'

// Create Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Interface for employee creation
export interface EmployeeFormData {
  full_name: string
  email: string
  password: string
  home_branch_id: string
  hourly_rate: number
  daily_rate: number
  user_role?: 'employee'
  is_active?: boolean
}

// Helper function to fetch employee list with service role
async function getEmployeeListWithServiceRole(
  supabaseAdmin: SupabaseClient,
  filters: SearchFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<EmployeeListResponse> {
  try {
    const { 
      search, 
      branchId, 
      role, 
      status, 
      sortBy = 'created_at', 
      sortOrder = 'desc' 
    } = filters
    const { page, limit } = pagination

    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        branch_id,
        is_active,
        created_at
      `, { count: 'exact' })

    // Apply search filter
    if (search && search.trim() !== '') {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
    }

    // Apply branch filter
    if (branchId) {
      console.log('🏢 Filtering by branch ID:', branchId)
      query = query.eq('branch_id', branchId)
    }

    // Apply role filter
    if (role) {
      query = query.eq('role', role)
    }

    // Apply status filter
    if (status) {
      const isActive = status === 'active'
      query = query.eq('is_active', isActive)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Employee list service error:', error)
      throw new Error(`Failed to fetch employees: ${error.message}`)
    }

    // Get unique branch IDs from users
    const branchIds = [...new Set((data || []).map((user: any) => user.branch_id).filter(Boolean))]
    
    // Fetch branches data separately
    let branchesMap: Map<string, { name: string; address: string }> = new Map()
    if (branchIds.length > 0) {
      const { data: branchesData, error: branchesError } = await supabaseAdmin
        .from('branches')
        .select('id, name, address')
        .in('id', branchIds)
      
      if (!branchesError && branchesData) {
        branchesMap = new Map(
          branchesData.map((branch: any) => [branch.id, { name: branch.name, address: branch.address }])
        )
      }
    }

    // Transform data to match EmployeeListItem interface
    const employees: EmployeeListItem[] = (data || []).map((user: any) => {
      const branch = user.branch_id ? branchesMap.get(user.branch_id) : null
      
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        branch_id: user.branch_id,
        is_active: user.is_active,
        created_at: user.created_at,
        branch_name: branch?.name || 'ไม่ระบุสาขา',
        branch_address: branch?.address || ''
      }
    })

    return {
      data: employees,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }

  } catch (error) {
    console.error('Error in getEmployeeListWithServiceRole:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'ไม่พบการยืนยันตัวตน' }, { status: 401 })
    }

    // Extract token from Bearer header
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    const filters: SearchFilters = {
      search: searchParams.get('search') || undefined,
      branchId: searchParams.get('branchId') || undefined,
      role: (searchParams.get('role') as 'employee' | 'admin') || undefined,
      status: (searchParams.get('status') as 'active' | 'inactive') || undefined,
      sortBy: (searchParams.get('sortBy') as 'full_name' | 'email' | 'created_at') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    console.log('🔍 Employee list filters:', filters)

    const pagination: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100) // Cap at 100 for performance
    }

    // Validate pagination parameters
    if (pagination.page < 1) {
      pagination.page = 1
    }
    if (pagination.limit < 1) {
      pagination.limit = 20
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch employee list directly with service role
    const result = await getEmployeeListWithServiceRole(supabaseAdmin, filters, pagination)

    return NextResponse.json({
      success: true,
      message: 'ดึงข้อมูลพนักงานสำเร็จ',
      ...result
    })

  } catch (error) {
    console.error('Admin employees API error:', error)
    
    // Return Thai error message
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน'
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}

// Validation function for employee data
function validateEmployeeData(data: EmployeeFormData) {
  const errors: string[] = []

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push('ชื่อ-สกุลต้องมีอย่างน้อย 2 ตัวอักษร')
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('อีเมลไม่ถูกต้อง')
  }

  if (!data.password || data.password.length < 8) {
    errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
  }

  if (!data.home_branch_id) {
    errors.push('กรุณาเลือกสาขาหลัก')
  }

  if (!data.hourly_rate || data.hourly_rate < 0 || data.hourly_rate > 10000) {
    errors.push('อัตราค่าแรงรายชั่วโมงต้องอยู่ระหว่าง 0-10,000 บาท')
  }

  if (!data.daily_rate || data.daily_rate < 0 || data.daily_rate > 50000) {
    errors.push('อัตราค่าแรงรายวันต้องอยู่ระหว่าง 0-50,000 บาท')
  }

  return errors
}

export async function POST(request: NextRequest) {
  try {
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
    const employeeData: EmployeeFormData = await request.json()

    // Validate data
    const validationErrors = validateEmployeeData(employeeData)
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        validationErrors
      }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', employeeData.email)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'อีเมลนี้มีอยู่ในระบบแล้ว'
      }, { status: 409 })
    }

    // Check if branch exists
    const { data: branch } = await supabase
      .from('branches')
      .select('id')
      .eq('id', employeeData.home_branch_id)
      .single()

    if (!branch) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบสาขาที่เลือก'
      }, { status: 400 })
    }

    // Create Supabase Auth user
    const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: employeeData.email,
      password: employeeData.password,
      email_confirm: true
    })

    if (createUserError || !authUser.user) {
      console.error('Create auth user error:', {
        error: createUserError,
        message: createUserError?.message,
        status: createUserError?.status,
        details: createUserError
      })

      // Return more specific error message
      const errorMessage = createUserError?.message
        ? `ไม่สามารถสร้างบัญชีผู้ใช้ได้: ${createUserError.message}`
        : 'ไม่สามารถสร้างบัญชีผู้ใช้ได้'

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 500 })
    }

    // Generate username from email (part before @)
    const username = employeeData.email.split('@')[0].toLowerCase()

    // Create user record in users table
    const { data: newEmployee, error: createEmployeeError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: employeeData.email,
        username: username,
        full_name: employeeData.full_name.trim(),
        role: employeeData.user_role || 'employee',
        branch_id: employeeData.home_branch_id, // Map home_branch_id to branch_id
        hourly_rate: employeeData.hourly_rate,
        daily_rate: employeeData.daily_rate,
        is_active: employeeData.is_active ?? true
      })
      .select()
      .single()

    if (createEmployeeError) {
      console.error('Create employee error:', {
        error: createEmployeeError,
        message: createEmployeeError?.message,
        code: createEmployeeError?.code,
        details: createEmployeeError?.details,
        hint: createEmployeeError?.hint,
        employeeData: {
          id: authUser.user.id,
          email: employeeData.email,
          full_name: employeeData.full_name,
          role: employeeData.user_role || 'employee',
          branch_id: employeeData.home_branch_id,
          hourly_rate: employeeData.hourly_rate,
          daily_rate: employeeData.daily_rate,
          is_active: employeeData.is_active ?? true
        }
      })

      // Rollback: Delete auth user if employee creation failed
      await supabase.auth.admin.deleteUser(authUser.user.id)

      // Return more specific error message
      const errorMessage = createEmployeeError?.message
        ? `ไม่สามารถสร้างข้อมูลพนักงานได้: ${createEmployeeError.message}`
        : 'ไม่สามารถสร้างข้อมูลพนักงานได้'

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'สร้างพนักงานใหม่สำเร็จ',
      employee: {
        id: newEmployee.id,
        email: newEmployee.email,
        full_name: newEmployee.full_name,
        role: newEmployee.role,
        home_branch_id: newEmployee.branch_id, // Map branch_id to home_branch_id
        hourly_rate: newEmployee.hourly_rate,
        daily_rate: newEmployee.daily_rate,
        is_active: newEmployee.is_active,
        created_at: newEmployee.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create employee API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการสร้างพนักงาน'
    }, { status: 500 })
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}