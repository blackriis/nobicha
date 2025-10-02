import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { authRateLimiter } from '@/lib/rate-limit'
import { validateRequestBody } from '@/lib/validation'

// GET /api/admin/raw-materials - Get all raw materials with pagination
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'คำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง' },
        { status: 429 }
      )
    }

    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Get user profile and check admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'ต้องมีสิทธิ์ admin เท่านั้น' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search')?.trim()
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? false : true

    // Build query
    let query = supabase
      .from('raw_materials')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Apply sorting
    const validSortColumns = ['name', 'cost_per_unit', 'created_at']
    const actualSortBy = sortBy === 'cost_price' ? 'cost_per_unit' : sortBy
    if (validSortColumns.includes(actualSortBy)) {
      query = query.order(actualSortBy, { ascending: sortOrder })
    } else {
      query = query.order('name', { ascending: true })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: rawMaterials, count, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: rawMaterials,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('GET /api/admin/raw-materials error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

// POST /api/admin/raw-materials - Create new raw material
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'คำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง' },
        { status: 429 }
      )
    }

    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Get user profile and check admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'ต้องมีสิทธิ์ admin เท่านั้น' },
        { status: 403 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'รูปแบบ JSON ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Validate required fields
    const validation = validateRequestBody(body, ['name', 'unit', 'cost_price'])
    if (!validation.valid) {
      return NextResponse.json(
        { error: `ข้อมูลไม่ครบถ้วน: ${validation.errors.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate data types and constraints
    const name = body.name?.toString().trim()
    const unit = body.unit?.toString().trim()
    const costPrice = parseFloat(body.cost_price)

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: 'ชื่อวัตถุดิบต้องมีความยาว 1-100 ตัวอักษร' },
        { status: 400 }
      )
    }

    if (!unit || unit.length > 20) {
      return NextResponse.json(
        { error: 'หน่วยนับต้องมีความยาว 1-20 ตัวอักษร' },
        { status: 400 }
      )
    }

    if (isNaN(costPrice) || costPrice <= 0) {
      return NextResponse.json(
        { error: 'ราคาต้นทุนต้องเป็นตัวเลขบวกเท่านั้น' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const { data: existingMaterial } = await supabase
      .from('raw_materials')
      .select('id')
      .eq('name', name)
      .single()

    if (existingMaterial) {
      return NextResponse.json(
        { error: 'ชื่อวัตถุดิบนี้มีในระบบแล้ว กรุณาเลือกชื่ออื่น' },
        { status: 409 }
      )
    }

    // Create raw material
    const { data: newMaterial, error } = await supabase
      .from('raw_materials')
      .insert([{
        name,
        unit,
        cost_per_unit: costPrice
      }])
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการสร้างวัตถุดิบ' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newMaterial
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/admin/raw-materials error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}
