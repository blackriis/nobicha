import { NextRequest, NextResponse } from 'next/server';
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server';
import type { TimeEntryDetail } from 'packages/database';
import { calculateDistance } from '@/lib/utils/gps.utils';
import { isValidUUID } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Input validation for time entry id
    if (!id || typeof id !== 'string' || id.length === 0) {
      return NextResponse.json(
        { error: 'จำเป็นต้องระบุ ID การลงเวลา' },
        { status: 400 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'รูปแบบ ID ไม่ถูกต้อง ต้องเป็น UUID' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with server-side auth-aware cookies
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'จำเป็นต้องเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // Query time entry without branches join to avoid schema cache issues
    const { data: timeEntryData, error: timeEntryError } = await supabase
      .from('time_entries')
      .select(`
        id,
        user_id,
        branch_id,
        check_in_time,
        check_out_time,
        check_in_selfie_url,
        check_out_selfie_url,
        created_at
      `)
      .eq('id', id)
      .eq('user_id', user.id) // Security check: only owner can access
      .single();

    if (timeEntryError) {
      console.error('Time entry query error:', timeEntryError);
      if (timeEntryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลการลงเวลา' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'ไม่สามารถดึงรายละเอียดการทำงานได้', details: timeEntryError.message },
        { status: 500 }
      );
    }

    if (!timeEntryData) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการลงเวลาหรือไม่มีสิทธิ์เข้าถึง' },
        { status: 404 }
      );
    }

    // Fetch branch data separately to avoid RLS and schema cache issues
    let branchData = null;
    if (timeEntryData.branch_id) {
      const adminClient = createSupabaseServerClient();
      const { data: branch, error: branchError } = await adminClient
        .from('branches')
        .select('id, name, address, latitude, longitude')
        .eq('id', timeEntryData.branch_id)
        .single();

      if (branchError) {
        console.error('Branch query error:', branchError);
        // Continue without branch data rather than failing
      } else {
        branchData = branch;
      }
    }

    // Query material usage for this time entry
    const { data: materialUsageData, error: materialError } = await supabase
      .from('material_usage')
      .select(`
        id,
        quantity_used,
        raw_materials!inner (
          name,
          unit
        )
      `)
      .eq('time_entry_id', id);

    if (materialError) {
      console.error('Material usage query error:', materialError);
      // Continue without material usage data rather than failing
    }

    // Calculate total hours if check-out time exists
    let totalHours: number | undefined;
    if (timeEntryData.check_out_time) {
      const checkInTime = new Date(timeEntryData.check_in_time);
      const checkOutTime = new Date(timeEntryData.check_out_time);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
    }

    // GPS coordinates not available in current schema
    // TODO: Add check_in_location and check_out_location columns to time_entries table
    let checkInLocation: TimeEntryDetail['check_in_location'] = undefined;

    // Format response according to TimeEntryDetail interface
    const timeEntryDetail: TimeEntryDetail = {
      id: timeEntryData.id,
      employee_id: timeEntryData.user_id,
      branch: branchData ? {
        id: branchData.id,
        name: branchData.name,
        latitude: branchData.latitude,
        longitude: branchData.longitude,
        address: branchData.address,
      } : {
        id: timeEntryData.branch_id,
        name: 'ไม่ระบุสาขา',
        latitude: 0,
        longitude: 0,
      },
      check_in_time: timeEntryData.check_in_time,
      check_out_time: timeEntryData.check_out_time,
      check_in_selfie_url: timeEntryData.check_in_selfie_url || '',
      check_out_selfie_url: timeEntryData.check_out_selfie_url || undefined,
      check_in_location: checkInLocation,
      material_usage: (materialUsageData || []).map(item => ({
        raw_material: {
          name: item.raw_materials.name,
          unit: item.raw_materials.unit,
        },
        quantity_used: item.quantity_used,
      })),
      total_hours: totalHours,
    };

    return NextResponse.json({
      success: true,
      data: timeEntryDetail,
    });

  } catch (error) {
    console.error('Time entry detail API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', details: errorMessage },
      { status: 500 }
    );
  }
}
