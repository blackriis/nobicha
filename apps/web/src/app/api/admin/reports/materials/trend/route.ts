import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Helper to format Thai month labels
function formatThaiMonthLabel(dateString: string): string {
  const monthNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ]

  const [year, month] = dateString.split('-')
  const monthIndex = parseInt(month, 10) - 1
  const buddhistYear = parseInt(year, 10) + 543

  return `${monthNames[monthIndex]} ${buddhistYear}`
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const monthsParam = searchParams.get('months') || '3'
    const branchId = searchParams.get('branchId')

    const months = parseInt(monthsParam, 10)

    // Validate months parameter
    if (![3, 6, 12].includes(months)) {
      return NextResponse.json(
        { error: 'จำนวนเดือนไม่ถูกต้อง (ต้องเป็น 3, 6, หรือ 12)' },
        { status: 400 }
      )
    }

    // Get supabase client
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับการยืนยันตัวตน' },
        { status: 401 }
      )
    }

    // Generate month range
    const currentDate = new Date()
    const monthsData: Array<{
      month: string
      monthLabel: string
      totalCost: number
      totalUsageCount: number
      uniqueMaterialsUsed: number
    }> = []

    // Generate the last N months
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate)
      targetDate.setMonth(currentDate.getMonth() - i)

      const year = targetDate.getFullYear()
      const month = String(targetDate.getMonth() + 1).padStart(2, '0')
      const monthKey = `${year}-${month}`

      // Calculate start and end dates for the month
      const startDate = new Date(year, targetDate.getMonth(), 1)
      const endDate = new Date(year, targetDate.getMonth() + 1, 0, 23, 59, 59)

      // Build query with explicit typing
      interface MaterialUsageWithMaterial {
        id: string
        quantity: number
        total_cost: number
        material_id: string
        raw_materials: {
          id: string
          name: string
          unit: string
          supplier: string
          cost_per_unit: number
        }
      }

      let query = supabase
        .from('material_usage')
        .select(`
          id,
          quantity,
          total_cost,
          material_id,
          raw_materials!inner (
            id,
            name,
            unit,
            supplier,
            cost_per_unit
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Add branch filter if specified
      if (branchId && branchId !== 'null' && branchId !== 'undefined') {
        query = query.eq('branch_id', branchId)
      }

      const { data: usageData, error: usageError } = await query as { data: MaterialUsageWithMaterial[] | null, error: any }

      if (usageError) {
        console.error(`Error fetching data for ${monthKey}:`, usageError)
        // Continue with empty data for this month
        monthsData.push({
          month: monthKey,
          monthLabel: formatThaiMonthLabel(monthKey),
          totalCost: 0,
          totalUsageCount: 0,
          uniqueMaterialsUsed: 0
        })
        continue
      }

      // Calculate totals for this month
      const totalCost = usageData?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0
      const totalUsageCount = usageData?.length || 0
      const uniqueMaterialsUsed = new Set(usageData?.map(item => item.material_id)).size

      monthsData.push({
        month: monthKey,
        monthLabel: formatThaiMonthLabel(monthKey),
        totalCost,
        totalUsageCount,
        uniqueMaterialsUsed
      })
    }

    console.log('📊 Monthly trend data generated:', {
      months,
      branchId,
      dataPoints: monthsData.length
    })

    return NextResponse.json({
      data: monthsData,
      success: true
    })

  } catch (error) {
    console.error('Material trend API error:', error)
    return NextResponse.json(
      {
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแนวโน้มรายเดือน',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
