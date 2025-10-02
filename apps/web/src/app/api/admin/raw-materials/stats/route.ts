import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { authRateLimiter } from '@/lib/rate-limit'

// GET /api/admin/raw-materials/stats - Get raw materials statistics
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'คำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง' },
        { status: 429 }
      )
    }

    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Get user profile and check admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'ต้องมีสิทธิ์ admin เท่านั้น' },
        { status: 403 }
      )
    }

    // Execute parallel queries for statistics
    const [
      totalMaterialsResult,
      activeMaterialsResult,
      totalValueResult,
      lowStockResult,
      recentUsageResult
    ] = await Promise.all([
      // Total materials count
      supabase
        .from('raw_materials')
        .select('id', { count: 'exact' }),

      // Active materials count (assuming is_active field exists, fallback to all)
      supabase
        .from('raw_materials')
        .select('id', { count: 'exact' })
        .neq('cost_per_unit', 0), // Consider materials with cost > 0 as active

      // Total value calculation
      supabase
        .from('raw_materials')
        .select('cost_per_unit'),

      // Low stock materials (based on recent usage)
      // This is a simplified calculation - in practice you'd have inventory levels
      supabase
        .from('material_usage')
        .select(`
          material_id,
          quantity,
          raw_materials!inner(name)
        `)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('quantity', { ascending: false })
        .limit(10),

      // Recent usage cost (last 30 days)
      supabase
        .from('material_usage')
        .select('total_cost')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Handle database errors
    if (totalMaterialsResult.error) {
      console.error('Total materials query error:', totalMaterialsResult.error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลจำนวนวัตถุดิบ' },
        { status: 500 }
      )
    }

    if (activeMaterialsResult.error) {
      console.error('Active materials query error:', activeMaterialsResult.error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลวัตถุดิบที่ใช้งาน' },
        { status: 500 }
      )
    }

    if (totalValueResult.error) {
      console.error('Total value query error:', totalValueResult.error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการคำนวณมูลค่ารวม' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalMaterials = totalMaterialsResult.count || 0
    const activeMaterials = activeMaterialsResult.count || 0
    
    // Calculate total value (this is a simplified calculation)
    // In practice, you'd multiply cost_per_unit by current stock quantity
    const totalValue = totalValueResult.data?.reduce((sum, material) => {
      return sum + (material.cost_per_unit || 0)
    }, 0) || 0

    // Calculate low stock materials (simplified logic)
    // In practice, you'd compare current stock with minimum stock levels
    const frequentlyUsedMaterials = lowStockResult.data || []
    const lowStockMaterials = Math.min(frequentlyUsedMaterials.length, 10) // Simplified calculation

    // Calculate recent usage cost
    const recentUsageCost = recentUsageResult.data?.reduce((sum, usage) => {
      return sum + (usage.total_cost || 0)
    }, 0) || 0

    const stats = {
      totalMaterials,
      activeMaterials,
      lowStockMaterials,
      totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
      recentUsageCost: Math.round(recentUsageCost * 100) / 100,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('GET /api/admin/raw-materials/stats error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}