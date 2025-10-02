import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { generalRateLimiter } from '@/lib/rate-limit';

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

    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user exists and has employee role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single();

    if (userError || !userProfile || userProfile.role !== 'employee') {
      return NextResponse.json(
        { error: 'Employee access required' },
        { status: 403 }
      );
    }

    // Get current active time entry (if any)
    const { data: activeEntry, error: activeError } = await supabase
      .from('time_entries')
      .select(`
        id,
        check_in_time,
        check_out_time,
        total_hours,
        branch_id,
        branches (
          id,
          name,
          latitude,
          longitude
        )
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
        branch_id,
        branches (
          id,
          name
        )
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
        activeEntry: activeEntry ? {
          id: activeEntry.id,
          checkInTime: activeEntry.check_in_time,
          currentSessionHours: Math.round(currentSessionHours * 100) / 100,
          branch: {
            id: activeEntry.branches?.id,
            name: activeEntry.branches?.name,
            latitude: activeEntry.branches?.latitude,
            longitude: activeEntry.branches?.longitude
          }
        } : null,
        todayStats: {
          totalEntries: todayEntries?.length || 0,
          totalHours: Math.round(totalHoursToday * 100) / 100,
          completedSessions: todayEntries || []
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
