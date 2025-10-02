import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { rateLimitService } from '@/lib/services/rate-limit.service'

// GET /api/admin/rate-limit/analytics - Get rate limiting analytics (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Authentication check - Admin only
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get analytics data
    const analytics = rateLimitService.getAnalytics()
    const recommendations = rateLimitService.getRecommendations()

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        recommendations,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Rate limit analytics error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal Server Error',
        message: 'ไม่สามารถดึงข้อมูล analytics ได้'
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/rate-limit/analytics/reset - Reset analytics data (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication check - Admin only
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Reset analytics
    rateLimitService.resetAnalytics()

    return NextResponse.json({
      success: true,
      message: 'Analytics data has been reset successfully',
      messageTh: 'รีเซ็ตข้อมูล analytics เรียบร้อยแล้ว'
    })
  } catch (error) {
    console.error('Rate limit analytics reset error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal Server Error',
        message: 'ไม่สามารถรีเซ็ตข้อมูล analytics ได้'
      },
      { status: 500 }
    )
  }
}
