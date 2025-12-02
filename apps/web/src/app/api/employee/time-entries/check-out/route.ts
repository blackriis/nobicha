import { NextRequest, NextResponse } from 'next/server';
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { calculateDistance } from '@/lib/utils/gps.utils';
import { generalRateLimiter } from '@/lib/rate-limit';
import { config } from '@employee-management/config';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@employee-management/database';

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
    
    // Use service role client for database operations (same approach as status route)
    const adminClient = createAdminClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey || config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const supabase = adminClient;
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request data
    const body = await request.json();
    const { latitude, longitude, selfieUrl } = body;

    if (!latitude || !longitude || !selfieUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude, selfieUrl' },
        { status: 400 }
      );
    }

    // SECURITY: Validate selfieUrl belongs to current user
    if (!isValidSelfieUrl(selfieUrl, user.id)) {
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

    // Find active check-in entry
    const { data: activeEntry, error: activeError } = await supabase
      .from('time_entries')
      .select('id, check_in_time, branch_id')
      .eq('user_id', user.id)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single();

    if (activeError || !activeEntry) {
      return NextResponse.json(
        { error: 'ไม่พบการ check-in ที่ยังไม่ได้ check-out' },
        { status: 400 }
      );
    }

    // Get branch details for GPS validation
    // First, try to get branch with service role client
    let { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, name, latitude, longitude')
      .eq('id', activeEntry.branch_id)
      .single();

    // If branch not found, try to get any available branch as fallback
    // This handles cases where branch was deleted after check-in
    if (branchError || !branch) {
      console.error('❌ Branch query error:', {
        branchId: activeEntry.branch_id,
        error: branchError,
        errorCode: branchError?.code,
        errorMessage: branchError?.message,
        errorDetails: branchError?.details,
        errorHint: branchError?.hint,
        hasServiceRoleKey: !!config.supabase.serviceRoleKey
      });
      
      // Check if any branches exist (for debugging)
      const { data: allBranches } = await supabase
        .from('branches')
        .select('id, name')
        .limit(10);
      
      console.error('📋 Available branches in database:', allBranches?.map(b => ({ id: b.id, name: b.name })));
      
      // Try to get the first available branch as fallback (for data recovery)
      if (allBranches && allBranches.length > 0) {
        console.warn('⚠️ Using fallback branch due to missing branch_id:', {
          originalBranchId: activeEntry.branch_id,
          fallbackBranchId: allBranches[0].id,
          fallbackBranchName: allBranches[0].name
        });
        
        const { data: fallbackBranch } = await supabase
          .from('branches')
          .select('id, name, latitude, longitude')
          .eq('id', allBranches[0].id)
          .single();
        
        if (fallbackBranch) {
          branch = fallbackBranch;
          branchError = null;
        }
      }
      
      // If still no branch found, return error
      if (!branch) {
        return NextResponse.json(
          { 
            error: 'Branch not found',
            details: `Branch ID ${activeEntry.branch_id} does not exist in database. This may indicate data inconsistency.`,
            branchId: activeEntry.branch_id,
            suggestion: 'Please contact administrator to fix this issue. The check-in may have been created with an invalid branch ID.'
          },
          { status: 404 }
        );
      }
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

    // Validate selfie URL format
    if (typeof selfieUrl !== 'string' || !selfieUrl.trim()) {
      return NextResponse.json(
        { error: 'Invalid selfie URL' },
        { status: 400 }
      );
    }

    // Calculate total hours worked
    const checkInTime = new Date(activeEntry.check_in_time);
    const checkOutTime = new Date();
    const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Update time entry with check-out information and selfie URL (using updated database schema)
    const { data: updatedEntry, error: updateError } = await supabase
      .from('time_entries')
      .update({
        check_out_time: checkOutTime.toISOString(),
        check_out_selfie_url: selfieUrl,  // Use correct column name
        total_hours: Math.round(totalHours * 100) / 100 // Round to 2 decimal places
      })
      .eq('id', activeEntry.id)
      .select('id, check_in_time, check_out_time, total_hours, branch_id')
      .single();

    if (updateError) {
      console.error('Database error updating time entry:', updateError);
      return NextResponse.json(
        { error: 'Failed to update time entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timeEntry: {
        id: updatedEntry.id,
        checkInTime: updatedEntry.check_in_time,
        checkOutTime: updatedEntry.check_out_time,
        totalHours: updatedEntry.total_hours,
        branchId: updatedEntry.branch_id,
        branchName: branch.name
      },
      message: `Check-out สำเร็จที่สาขา ${branch.name} (ทำงาน ${updatedEntry.total_hours} ชั่วโมง)`
    });

  } catch (error) {
    console.error('Check-out API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
