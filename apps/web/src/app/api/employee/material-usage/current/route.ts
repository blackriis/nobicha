import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { authRateLimiter } from '@/lib/rate-limit'

// GET /api/employee/material-usage/current - Get current session material usage
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
      return NextResponse.json({
        success: true,
        data: {
          has_active_session: false,
          message: 'ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์'
        }
      })
    }

    // Get existing material usage for current session
    const { data: usageRecords, error } = await supabase
      .from('material_usage')
      .select(`
        id,
        time_entry_id,
        material_id,
        quantity_used,
        created_at,
        raw_materials (
          id,
          name,
          unit
        )
      `)
      .eq('time_entry_id', activeTimeEntry.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการใช้วัตถุดิบ' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        has_active_session: true,
        time_entry_id: activeTimeEntry.id,
        records: usageRecords || [],
        can_add_materials: true
      }
    })

  } catch (error) {
    console.error('GET /api/employee/material-usage/current error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}