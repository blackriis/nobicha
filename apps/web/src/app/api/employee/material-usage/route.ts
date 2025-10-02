import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { authRateLimiter } from '@/lib/rate-limit'
import { validateRequestBody } from '@/lib/validation'

// POST /api/employee/material-usage - Create new material usage record
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

    // Get user profile and check employee role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'employee') {
      return NextResponse.json(
        { error: 'ต้องมีสิทธิ์พนักงานเท่านั้น' },
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
    const validation = validateRequestBody(body, ['materials'])
    if (!validation.valid) {
      return NextResponse.json(
        { error: `ข้อมูลไม่ครบถ้วน: ${validation.errors.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate materials array
    if (!Array.isArray(body.materials) || body.materials.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ' },
        { status: 400 }
      )
    }

    // Validate each material entry
    for (const material of body.materials) {
      if (!material.material_id || !material.quantity_used) {
        return NextResponse.json(
          { error: 'ข้อมูลวัตถุดิบไม่ครบถ้วน' },
          { status: 400 }
        )
      }

      const quantity = parseFloat(material.quantity_used)
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: 'จำนวนต้องเป็นตัวเลขบวกเท่านั้น' },
          { status: 400 }
        )
      }
    }

    // Check for active time entry
    const { data: activeTimeEntry, error: timeError } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', user.id)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    if (timeError || !activeTimeEntry) {
      return NextResponse.json(
        { error: 'ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์ กรุณาเช็คอินก่อนรายงานการใช้วัตถุดิบ' },
        { status: 400 }
      )
    }

    // Verify all raw materials exist and get their costs
    const materialIds = body.materials.map((m: { material_id: string }) => m.material_id)
    const { data: validMaterials, error: materialError } = await supabase
      .from('raw_materials')
      .select('id, cost_per_unit')
      .in('id', materialIds)

    if (materialError || validMaterials.length !== materialIds.length) {
      return NextResponse.json(
        { error: 'วัตถุดิบที่เลือกไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Create a map of material costs for quick lookup
    const materialCosts = new Map<string, number>()
    validMaterials.forEach(material => {
      materialCosts.set(material.id, material.cost_per_unit || 0)
    })

    // Insert material usage records with costs
    const usageRecords = body.materials.map((material: { material_id: string; quantity_used: string | number }) => {
      const quantity = parseFloat(material.quantity_used)
      const unitCost = materialCosts.get(material.material_id) || 0
      const totalCost = quantity * unitCost
      
      return {
        time_entry_id: activeTimeEntry.id,
        material_id: material.material_id,
        quantity_used: quantity,
        unit_cost: unitCost,
        total_cost: totalCost
      }
    })

    const { data: createdRecords, error } = await supabase
      .from('material_usage')
      .insert(usageRecords)
      .select(`
        id,
        time_entry_id,
        material_id,
        quantity_used,
        unit_cost,
        total_cost,
        created_at,
        raw_materials (
          id,
          name,
          unit,
          cost_per_unit
        )
      `)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการบันทึกการใช้วัตถุดิบ' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        records: createdRecords,
        time_entry_id: activeTimeEntry.id
      }
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/employee/material-usage error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}