import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
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
        { error: 'Time entry ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid time entry ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with server-side auth-aware cookies
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Query time entry with JOINs for branch, material usage, and raw materials
    const { data: timeEntryData, error: timeEntryError } = await supabase
      .from('time_entries')
      .select(`
        id,
        user_id,
        check_in_time,
        check_out_time,
        check_in_selfie_url,
        check_out_selfie_url,
        created_at,
        branches!inner (
          id,
          name,
          latitude,
          longitude
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id) // Security check: only owner can access
      .single();

    if (timeEntryError) {
      if (timeEntryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Time entry not found' },
          { status: 404 }
        );
      }
      console.error('Time entry query error:', timeEntryError);
      return NextResponse.json(
        { error: 'Failed to fetch time entry details' },
        { status: 500 }
      );
    }

    if (!timeEntryData) {
      return NextResponse.json(
        { error: 'Time entry not found or access denied' },
        { status: 404 }
      );
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
      branch: {
        id: timeEntryData.branches.id,
        name: timeEntryData.branches.name,
        latitude: timeEntryData.branches.latitude,
        longitude: timeEntryData.branches.longitude,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
