import { NextRequest, NextResponse } from 'next/server'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'
import { generalRateLimiter, createRateLimitResponse } from '@/lib/rate-limit'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    console.log('🗑️  Payroll reset request started:', {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method
    })

    // Rate limiting
    const { allowed, resetTime } = generalRateLimiter.checkLimit(request)
    if (!allowed) {
      return createRateLimitResponse(resetTime!)
    }

    const supabase = await createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' }, 
        { status: 401 }
      )
    }

    // Verify admin role using service role client
    const serviceSupabase = await createSupabaseServerClient()
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'admin') {
      console.error('Admin verification failed:', { userError, userData })
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - ต้องเป็น Admin เท่านั้น' }, 
        { status: 403 }
      )
    }

    const { id: cycleId } = await context.params
    
    console.log('🔄 Resetting payroll for cycle:', cycleId)

    // Validate payroll cycle exists and is active
    const { data: cycle, error: cycleError } = await serviceSupabase
      .from('payroll_cycles')
      .select('*')
      .eq('id', cycleId)
      .single()

    if (cycleError || !cycle) {
      return NextResponse.json(
        { error: 'ไม่พบรอบการจ่ายเงินเดือนที่ระบุ' },
        { status: 404 }
      )
    }

    if (cycle.status !== 'active') {
      console.error('Cannot reset non-active cycle:', {
        cycle_id: cycleId,
        current_status: cycle.status
      })
      return NextResponse.json(
        { error: `ไม่สามารถรีเซ็ตรอบการจ่ายเงินเดือนที่สถานะ: ${cycle.status} (ต้องเป็น active)` },
        { status: 400 }
      )
    }

    // Delete existing payroll details for this cycle
    console.log('🗑️  Deleting existing payroll details...')
    const { error: deleteError } = await serviceSupabase
      .from('payroll_details')
      .delete()
      .eq('payroll_cycle_id', cycleId)

    if (deleteError) {
      console.error('Error deleting payroll details:', deleteError)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการลบข้อมูลเงินเดือนเดิม' },
        { status: 500 }
      )
    }

    console.log('✅ Payroll details deleted successfully for cycle:', cycleId)

    return NextResponse.json({
      message: 'รีเซ็ตข้อมูลเงินเดือนเรียบร้อยแล้ว สามารถคำนวณใหม่ได้',
      cycle_id: cycleId,
      deleted_at: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in payroll reset:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดที่ไม่คาดคิดในการรีเซ็ตข้อมูล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}