import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generalRateLimiter, createRateLimitResponse } from '@/lib/rate-limit'
import { auditService } from '@/lib/services/audit.service'
import type { PayrollDetail } from '@employee-management/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const { allowed, resetTime } = generalRateLimiter.checkLimit(request);
    if (!allowed) {
      return createRateLimitResponse(resetTime!);
    }

    const supabase = await createClient();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' }, 
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - ต้องเป็น Admin เท่านั้น' }, 
        { status: 403 }
      );
    }

    const { bonus, bonus_reason } = await request.json()
    const { id: payrollDetailId } = await params

    // Validation
    if (typeof bonus !== 'number' || bonus < 0) {
      return NextResponse.json(
        { error: 'จำนวนโบนัสต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      )
    }

    if (bonus > 0 && (!bonus_reason || bonus_reason.trim().length === 0)) {
      return NextResponse.json(
        { error: 'กรุณาระบุเหตุผลในการให้โบนัส' },
        { status: 400 }
      )
    }

    // Get existing payroll detail
    const { data: payrollDetail, error: fetchError } = await supabase
      .from('payroll_details')
      .select(`
        *,
        payroll_cycles!inner(status)
      `)
      .eq('id', payrollDetailId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลรายละเอียดเงินเดือน' },
        { status: 404 }
      )
    }

    // Check if payroll cycle is completed (prevent modification)
    if (payrollDetail.payroll_cycles.status === 'completed') {
      return NextResponse.json(
        { error: 'ไม่สามารถแก้ไขโบนัสในรอบที่ปิดแล้ว' },
        { status: 403 }
      )
    }

    // Calculate new net_pay
    const newNetPay = payrollDetail.base_pay + payrollDetail.overtime_pay + bonus - payrollDetail.deduction

    // Validate that net_pay doesn't go negative
    if (newNetPay < 0) {
      return NextResponse.json(
        { error: 'เงินเดือนสุทธิไม่สามารถติดลบได้' },
        { status: 400 }
      )
    }

    // Store old values for audit trail
    const oldValues = {
      bonus: payrollDetail.bonus,
      bonus_reason: payrollDetail.bonus_reason,
      net_pay: payrollDetail.net_pay
    }

    // Update payroll detail
    const { data: updatedDetail, error: updateError } = await supabase
      .from('payroll_details')
      .update({
        bonus,
        bonus_reason: bonus > 0 ? bonus_reason : null,
        net_pay: newNetPay
      })
      .eq('id', payrollDetailId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการอัปเดตโบนัส' },
        { status: 500 }
      )
    }

    // Create audit log
    await auditService.log({
      userId: user.id,
      action: 'UPDATE',
      tableName: 'payroll_details',
      recordId: payrollDetailId,
      oldValues: oldValues,
      newValues: {
        bonus,
        bonus_reason,
        net_pay: newNetPay
      },
      description: `Updated bonus: ${bonus} บาท (${bonus_reason || 'ไม่มีเหตุผล'})`,
      request
    })

    return NextResponse.json({
      message: 'อัปเดตโบนัสเรียบร้อยแล้ว',
      data: updatedDetail
    })

  } catch (error) {
    console.error('Error updating bonus:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const { allowed, resetTime } = generalRateLimiter.checkLimit(request);
    if (!allowed) {
      return createRateLimitResponse(resetTime!);
    }

    const supabase = await createClient();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' }, 
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - ต้องเป็น Admin เท่านั้น' }, 
        { status: 403 }
      );
    }

    const { id: payrollDetailId } = await params

    // Get existing payroll detail
    const { data: payrollDetail, error: fetchError } = await supabase
      .from('payroll_details')
      .select(`
        *,
        payroll_cycles!inner(status)
      `)
      .eq('id', payrollDetailId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลรายละเอียดเงินเดือน' },
        { status: 404 }
      )
    }

    // Check if payroll cycle is completed
    if (payrollDetail.payroll_cycles.status === 'completed') {
      return NextResponse.json(
        { error: 'ไม่สามารถลบโบนัสในรอบที่ปิดแล้ว' },
        { status: 403 }
      )
    }

    // Calculate new net_pay without bonus
    const newNetPay = payrollDetail.base_pay + payrollDetail.overtime_pay - payrollDetail.deduction

    // Store old values for audit trail
    const oldValues = {
      bonus: payrollDetail.bonus,
      bonus_reason: payrollDetail.bonus_reason,
      net_pay: payrollDetail.net_pay
    }

    // Remove bonus
    const { data: updatedDetail, error: updateError } = await supabase
      .from('payroll_details')
      .update({
        bonus: 0,
        bonus_reason: null,
        net_pay: newNetPay
      })
      .eq('id', payrollDetailId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการลบโบนัส' },
        { status: 500 }
      )
    }

    // Create audit log
    await auditService.log({
      userId: user.id,
      action: 'DELETE',
      tableName: 'payroll_details',
      recordId: payrollDetailId,
      oldValues: oldValues,
      newValues: {
        bonus: 0,
        bonus_reason: null,
        net_pay: newNetPay
      },
      description: `Deleted bonus: ${payrollDetail.bonus} บาท (${payrollDetail.bonus_reason || 'ไม่มีเหตุผล'})`,
      request
    })

    return NextResponse.json({
      message: 'ลบโบนัสเรียบร้อยแล้ว',
      data: updatedDetail
    })

  } catch (error) {
    console.error('Error deleting bonus:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    )
  }
}