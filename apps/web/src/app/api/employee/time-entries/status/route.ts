import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generalRateLimiter } from '@/lib/rate-limit';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { config } from '@employee-management/config';
import type { Database } from '@employee-management/database';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = generalRateLimiter.checkLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Use createClient() for SSR - reads cookies correctly
    const supabase = await createClient();

    // Check authentication from cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('🔍 Status API - Auth Check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });

    if (authError || !user) {
      console.error('❌ Status API - Auth failed:', {
        authError: authError?.message,
        hasUser: !!user
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user exists and has employee role
    // Use service role key to bypass RLS for user profile check
    const adminClient = createAdminClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey || config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data: userProfile, error: userError } = await adminClient
      .from('users')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single();

    console.log('🔍 Status API - User Profile Query:', {
      userId: user.id,
      hasProfile: !!userProfile,
      profileRole: userProfile?.role,
      profileName: userProfile?.full_name,
      error: userError?.message
    });

    if (userError) {
      console.error('❌ Status API - Error fetching user profile:', {
        userId: user.id,
        error: userError.message,
        code: userError.code,
        details: userError.details,
        hint: userError.hint
      })
      
      // If user profile doesn't exist, return 403
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { 
            error: 'Employee access required',
            message: 'User profile not found. Please contact administrator.'
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to verify user role',
          message: userError.message
        },
        { status: 500 }
      )
    }

    if (!userProfile || userProfile.role !== 'employee') {
      console.error('❌ Status API - Role check failed:', {
        userId: user.id,
        userEmail: user.email,
        hasProfile: !!userProfile,
        actualRole: userProfile?.role || 'not found',
        requiredRole: 'employee'
      })

      return NextResponse.json(
        {
          error: 'Employee access required',
          message: `Access denied. Current role: ${userProfile?.role || 'not found'}. Employee role required.`
        },
        { status: 403 }
      )
    }

    console.log('✅ Status API - Role check passed:', {
      userId: user.id,
      role: userProfile.role
    });

    // Get current active time entry (if any) - without branches join to avoid schema cache issues
    const { data: activeEntry, error: activeError } = await supabase
      .from('time_entries')
      .select(`
        id,
        check_in_time,
        check_out_time,
        total_hours,
        branch_id
      `)
      .eq('user_id', user.id)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeError && activeError.code !== 'PGRST116') {
      console.error('Database error getting active entry:', activeError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Get today's completed time entries
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const { data: todayEntries, error: todayError } = await supabase
      .from('time_entries')
      .select(`
        id,
        check_in_time,
        check_out_time,
        total_hours,
        branch_id
      `)
      .eq('user_id', user.id)
      .not('check_out_time', 'is', null)
      .gte('check_in_time', startOfDay.toISOString())
      .lt('check_in_time', endOfDay.toISOString())
      .order('check_in_time', { ascending: false });

    if (todayError) {
      console.error('Database error getting today entries:', todayError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Fetch branch data for active entry and today entries
    let activeBranch = null;
    if (activeEntry && activeEntry.branch_id) {
      const { data: branchData } = await adminClient
        .from('branches')
        .select('id, name, latitude, longitude')
        .eq('id', activeEntry.branch_id)
        .single();
      activeBranch = branchData;
    }

    // Fetch branch data for today's entries
    const branchIds = [...new Set(todayEntries?.map(entry => entry.branch_id) || [])];
    const { data: branches } = await adminClient
      .from('branches')
      .select('id, name, latitude, longitude')
      .in('id', branchIds);

    const branchMap = new Map(branches?.map(b => [b.id, b]) || []);

    // Calculate total hours worked today
    const totalHoursToday = todayEntries?.reduce((sum, entry) => {
      return sum + (entry.total_hours || 0);
    }, 0) || 0;

    // Calculate current session hours if checked in
    let currentSessionHours = 0;
    if (activeEntry) {
      const checkInTime = new Date(activeEntry.check_in_time);
      const now = new Date();
      currentSessionHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    }

    return NextResponse.json({
      user: {
        id: userProfile.id,
        fullName: userProfile.full_name
      },
      status: {
        isCheckedIn: !!activeEntry,
        activeEntry: activeEntry && activeBranch ? {
          id: activeEntry.id,
          checkInTime: activeEntry.check_in_time,
          currentSessionHours: Math.round(currentSessionHours * 100) / 100,
          branch: {
            id: activeBranch.id,
            name: activeBranch.name,
            latitude: activeBranch.latitude,
            longitude: activeBranch.longitude
          }
        } : null,
        todayStats: {
          totalEntries: todayEntries?.length || 0,
          totalHours: Math.round(totalHoursToday * 100) / 100,
          completedSessions: todayEntries?.map(entry => ({
            ...entry,
            branch: branchMap.get(entry.branch_id) || null
          })) || []
        }
      }
    });

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
