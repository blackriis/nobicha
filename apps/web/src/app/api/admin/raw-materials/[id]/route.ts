import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { authRateLimiter } from '@/lib/rate-limit'
import { validateRequestBody, isValidUUID } from '@/lib/validation'

type RouteParams = {
  params: Promise<{ id: string }>
}

// PUT /api/admin/raw-materials/[id] - Update raw material
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    // Await params before using (Next.js 15 requires params to be a Promise)
    const { id } = await context.params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'รหัสวัตถุดิบไม่ถูกต้อง' },
        { status: 400 }
      )
    }

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

    // Check if raw material exists
    const { data: existingMaterial, error: fetchError } = await supabase
      .from('raw_materials')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingMaterial) {
      return NextResponse.json(
        { error: 'ไม่พบวัตถุดิบที่ต้องการแก้ไข' },
        { status: 404 }
      )
    }

    // Check for duplicate name (only if name is being changed)
    if (name !== existingMaterial.name) {
      const { data: duplicateMaterial } = await supabase
        .from('raw_materials')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .single()

      if (duplicateMaterial) {
        return NextResponse.json(
          { error: 'ชื่อวัตถุดิบนี้มีในระบบแล้ว กรุณาเลือกชื่ออื่น' },
          { status: 409 }
        )
      }
    }

    // Update raw material
    const { data: updatedMaterial, error } = await supabase
      .from('raw_materials')
      .update({
        name,
        unit,
        cost_per_unit: costPrice
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการแก้ไขวัตถุดิบ' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedMaterial
    })

  } catch (error) {
    console.error('PUT /api/admin/raw-materials/[id] error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/raw-materials/[id] - Delete raw material
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    // Await params before using (Next.js 15 requires params to be a Promise)
    const { id } = await context.params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'รหัสวัตถุดิบไม่ถูกต้อง' },
        { status: 400 }
      )
    }

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

    // Check if raw material exists
    const { data: existingMaterial, error: fetchError } = await supabase
      .from('raw_materials')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingMaterial) {
      return NextResponse.json(
        { error: 'ไม่พบวัตถุดิบที่ต้องการลบ' },
        { status: 404 }
      )
    }

    // Check if raw material is being used in material_usage table
    const { data: usageRecords, error: usageError } = await supabase
      .from('material_usage')
      .select('id')
      .eq('material_id', id)
      .limit(1)

    if (usageError) {
      console.error('Error checking material usage:', usageError)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการตรวจสอบการใช้งาน' },
        { status: 500 }
      )
    }

    if (usageRecords && usageRecords.length > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบวัตถุดิบนี้ได้ เนื่องจากมีการใช้งานในระบบ' },
        { status: 409 }
      )
    }

    // Delete raw material
    const { error: deleteError } = await supabase
      .from('raw_materials')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการลบวัตถุดิบ' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ลบวัตถุดิบเรียบร้อยแล้ว'
    })

  } catch (error) {
    console.error('DELETE /api/admin/raw-materials/[id] error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}
