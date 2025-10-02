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

    const { deduction, deduction_reason } = await request.json()
    const { id: payrollDetailId } = await params

    // Validation
    if (typeof deduction !== 'number' || deduction < 0) {
      return NextResponse.json(
        { error: 'จำนวนหักเงินต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      )
    }

    if (deduction > 0 && (!deduction_reason || deduction_reason.trim().length === 0)) {
      return NextResponse.json(
        { error: 'กรุณาระบุเหตุผลในการหักเงิน' },
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
        { error: 'ไม่สามารถแก้ไขการหักเงินในรอบที่ปิดแล้ว' },
        { status: 403 }
      )
    }

    // Calculate new net_pay
    const newNetPay = payrollDetail.base_pay + payrollDetail.overtime_pay + payrollDetail.bonus - deduction

    // Validate that net_pay doesn't go negative
    if (newNetPay < 0) {
      return NextResponse.json(
        { error: 'เงินเดือนสุทธิไม่สามารถติดลบได้' },
        { status: 400 }
      )
    }

    // Store old values for audit trail
    const oldValues = {
      deduction: payrollDetail.deduction,
      deduction_reason: payrollDetail.deduction_reason,
      net_pay: payrollDetail.net_pay
    }

    // Update payroll detail
    const { data: updatedDetail, error: updateError } = await supabase
      .from('payroll_details')
      .update({
        deduction,
        deduction_reason: deduction > 0 ? deduction_reason : null,
        net_pay: newNetPay
      })
      .eq('id', payrollDetailId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการอัปเดตการหักเงิน' },
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
        deduction,
        deduction_reason,
        net_pay: newNetPay
      },
      description: `Updated deduction: ${deduction} บาท (${deduction_reason || 'ไม่มีเหตุผล'})`,
      request
    })

    return NextResponse.json({
      message: 'อัปเดตการหักเงินเรียบร้อยแล้ว',
      data: updatedDetail
    })

  } catch (error) {
    console.error('Error updating deduction:', error)
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
        { error: 'ไม่สามารถลบการหักเงินในรอบที่ปิดแล้ว' },
        { status: 403 }
      )
    }

    // Calculate new net_pay without deduction
    const newNetPay = payrollDetail.base_pay + payrollDetail.overtime_pay + payrollDetail.bonus

    // Store old values for audit trail
    const oldValues = {
      deduction: payrollDetail.deduction,
      deduction_reason: payrollDetail.deduction_reason,
      net_pay: payrollDetail.net_pay
    }

    // Remove deduction
    const { data: updatedDetail, error: updateError } = await supabase
      .from('payroll_details')
      .update({
        deduction: 0,
        deduction_reason: null,
        net_pay: newNetPay
      })
      .eq('id', payrollDetailId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการลบการหักเงิน' },
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
        deduction: 0,
        deduction_reason: null,
        net_pay: newNetPay
      },
      description: `Deleted deduction: ${payrollDetail.deduction} บาท (${payrollDetail.deduction_reason || 'ไม่มีเหตุผล'})`,
      request
    })

    return NextResponse.json({
      message: 'ลบการหักเงินเรียบร้อยแล้ว',
      data: updatedDetail
    })

  } catch (error) {
    console.error('Error deleting deduction:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    )
  }
}