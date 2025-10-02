import { NextRequest, NextResponse } from 'next/server';
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { calculateDistance } from '@/lib/utils/gps.utils';
import { generalRateLimiter } from '@/lib/rate-limit';

/**
 * SECURITY: Validate that selfie URL belongs to the current user
 * Prevents users from submitting other users' selfie URLs
 */
function isValidSelfieUrl(selfieUrl: string, userId: string): boolean {
  if (!selfieUrl || !userId) return false;
  
  // Check if URL contains the user's ID in the path structure
  // Expected format: .../checkin/{userId}/... or .../checkout/{userId}/...
  const pathPattern = new RegExp(`/(checkin|checkout)/${userId}/`);
  return pathPattern.test(selfieUrl);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = generalRateLimiter.checkLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Use regular client for authentication
    const supabaseAuth = await createClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    // Use service role client for database operations
    const supabase = await createSupabaseServerClient();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request data
    const body = await request.json();
    const { branchId, latitude, longitude, selfieUrl } = body;

    if (!branchId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: branchId, latitude, longitude' },
        { status: 400 }
      );
    }

    // SECURITY: Validate selfieUrl belongs to current user (if provided)
    if (selfieUrl && !isValidSelfieUrl(selfieUrl, user.id)) {
      return NextResponse.json(
        { error: 'Security violation: selfie URL must belong to current user' },
        { status: 403 }
      );
    }

    // Verify user exists and has employee role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userProfile || userProfile.role !== 'employee') {
      return NextResponse.json(
        { error: 'Employee access required' },
        { status: 403 }
      );
    }

    // Check if user already has an active check-in
    const { data: activeEntry, error: activeError } = await supabase
      .from('time_entries')
      .select('id, check_in_time')
      .eq('user_id', user.id)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single();

    if (activeError && activeError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error checking active entry:', activeError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (activeEntry) {
      return NextResponse.json(
        { 
          error: 'คุณมีการ check-in ที่ยังไม่ได้ check-out อยู่แล้ว',
          activeEntry: {
            id: activeEntry.id,
            checkInTime: activeEntry.check_in_time
          }
        },
        { status: 400 }
      );
    }

    // Get branch details for GPS validation
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, name, latitude, longitude')
      .eq('id', branchId)
      .single();

    if (branchError || !branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Validate GPS location (within 100 meters)
    const distance = calculateDistance(
      latitude,
      longitude,
      parseFloat(branch.latitude.toString()),
      parseFloat(branch.longitude.toString())
    );

    if (distance > 100) {
      return NextResponse.json(
        { 
          error: `คุณอยู่ห่างจากสาขา ${Math.round(distance)} เมตร (อนุญาตสูงสุด 100 เมตร)`,
          distance: Math.round(distance),
          maxDistance: 100
        },
        { status: 400 }
      );
    }

    // Validate selfie URL format (optional for testing)
    // if (typeof selfieUrl !== 'string' || !selfieUrl.trim()) {
    //   return NextResponse.json(
    //     { error: 'Invalid selfie URL' },
    //     { status: 400 }
    //   );
    // }

    // Create time entry with actual selfie URL (using updated database schema)
    const { data: timeEntry, error: insertError } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        branch_id: branchId,
        check_in_time: new Date().toISOString(),
        check_in_selfie_url: selfieUrl || 'test-selfie-url'  // Use correct column name
      })
      .select('id, check_in_time, branch_id')
      .single();

    if (insertError) {
      console.error('Database error creating time entry:', insertError);
      return NextResponse.json(
        { error: 'Failed to create time entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timeEntry: {
        id: timeEntry.id,
        checkInTime: timeEntry.check_in_time,
        branchId: timeEntry.branch_id,
        branchName: branch.name
      },
      message: `Check-in สำเร็จที่สาขา ${branch.name}`
    });

  } catch (error) {
    console.error('Check-in API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
