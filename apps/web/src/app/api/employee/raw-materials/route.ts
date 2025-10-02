import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { authRateLimiter } from '@/lib/rate-limit'

// GET /api/employee/raw-materials - Get available raw materials for employees
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

    // Get all active raw materials (employee view - NO COST DATA)
    const { data: rawMaterials, error } = await supabase
      .from('raw_materials')
      .select('id, name, unit')
      .order('name', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลวัตถุดิบ' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rawMaterials || []
    })

  } catch (error) {
    console.error('GET /api/employee/raw-materials error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}