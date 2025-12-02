import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limit'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/admin/reports/materials - Get material usage reports
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Materials Reports API called:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    })

    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      console.log('⚠️ Rate limit exceeded for materials reports')
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check (cookie-based)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔐 Auth status:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
      cookies: request.headers.get('cookie')?.length || 0
    })

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    // Get user profile and check role using service role client to bypass RLS
    const adminClient = await createSupabaseServerClient()
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile as { role: string }).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || 'today'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const branchId = searchParams.get('branchId')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Calculate date filter
    const now = new Date()
    let dateFilter = ''
    let useTimeFilter = true
    
    switch (dateRange) {
      case 'today':
        dateFilter = now.toISOString().split('T')[0]
        break
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'custom':
        dateFilter = startDate || now.toISOString().split('T')[0]
        break
      case 'all':
        // Don't apply any date filter for 'all'
        useTimeFilter = false
        break
      default:
        dateFilter = now.toISOString().split('T')[0]
    }

    console.log('📅 Date filter config:', {
      dateRange,
      dateFilter,
      useTimeFilter,
      startDate,
      endDate,
      branchId
    })

    // Step 1: Fetch material usage data
    let materialQuery = adminClient
      .from('material_usage')
      .select('id, material_id, time_entry_id, quantity_used, unit_cost, total_cost, notes, created_at')

    // Apply date filter only if specified
    if (useTimeFilter && dateFilter) {
      materialQuery = materialQuery.gte('created_at', dateFilter)
    }

    // Apply ordering and limit
    materialQuery = materialQuery.order('created_at', { ascending: false }).limit(limit)

    const { data: materialUsageData, error } = await materialQuery

    console.log('📊 Material usage result:', {
      dataCount: materialUsageData?.length || 0,
      hasError: !!error,
      errorMessage: error?.message
    })

    if (error) {
      console.error('Material usage query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch material usage reports', details: error.message },
        { status: 500 }
      )
    }

    // Step 2: Get raw materials data
    const materialIds = [...new Set(materialUsageData?.map(usage => usage.material_id) || [])]
    const { data: rawMaterials, error: materialsError } = await adminClient
      .from('raw_materials')
      .select('id, name, unit, cost_per_unit, supplier')
      .in('id', materialIds)

    if (materialsError) {
      console.error('Raw materials error:', materialsError)
      return NextResponse.json(
        { error: 'Failed to fetch raw materials', details: materialsError.message },
        { status: 500 }
      )
    }

    console.log('Raw materials found:', rawMaterials?.length || 0)

    // Step 3: Get time entries data
    const timeEntryIds = [...new Set(materialUsageData?.map(usage => usage.time_entry_id).filter(Boolean) || [])]
    let timeEntriesQuery = adminClient
      .from('time_entries')
      .select('id, user_id, branch_id')
      .in('id', timeEntryIds)

    // Apply branch filter if specified
    if (branchId) {
      timeEntriesQuery = timeEntriesQuery.eq('branch_id', branchId)
    }

    const { data: timeEntries, error: timeEntriesError } = await timeEntriesQuery

    if (timeEntriesError) {
      console.error('Time entries error:', timeEntriesError)
    }

    console.log('Time entries found:', timeEntries?.length || 0)

    // Step 4: Get users data
    const userIds = [...new Set(timeEntries?.map(entry => entry.user_id) || [])]
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id, full_name, employee_id')
      .in('id', userIds)

    if (usersError) {
      console.error('Users error:', usersError)
    }

    console.log('Users found:', users?.length || 0)

    // Step 5: Get branches data
    const branchIds = [...new Set(timeEntries?.map(entry => entry.branch_id) || [])]
    const { data: branches, error: branchesError } = await adminClient
      .from('branches')
      .select('id, name')
      .in('id', branchIds)

    if (branchesError) {
      console.error('Branches error:', branchesError)
    }

    console.log('Branches found:', branches?.length || 0)

    // Step 6: Combine data manually
    const materialsMap = new Map(rawMaterials?.map(material => [material.id, material]) || [])
    const timeEntriesMap = new Map(timeEntries?.map(entry => [entry.id, entry]) || [])
    const usersMap = new Map(users?.map(user => [user.id, user]) || [])
    const branchesMap = new Map(branches?.map(branch => [branch.id, branch]) || [])

    // Process material usage data
    const materialReports = materialUsageData?.map((usage: any) => {
      const material = materialsMap.get(usage.material_id)
      const timeEntry = timeEntriesMap.get(usage.time_entry_id)
      const user = timeEntry ? usersMap.get(timeEntry.user_id) : null
      const branch = timeEntry ? branchesMap.get(timeEntry.branch_id) : null

      return {
        id: usage.id,
        materialId: usage.material_id,
        materialName: material?.name || 'ไม่ระบุวัตถุดิบ',
        unit: material?.unit || 'N/A',
        costPerUnit: material?.cost_per_unit || 0,
        supplier: material?.supplier || 'ไม่ระบุ',
        quantityUsed: usage.quantity_used,
        unitCost: usage.unit_cost,
        totalCost: usage.total_cost,
        notes: usage.notes,
        createdAt: usage.created_at,
        employee: user ? {
          id: user.id,
          name: user.full_name,
          employeeId: user.employee_id
        } : {
          id: 'unknown',
          name: 'ไม่ระบุ',
          employeeId: 'N/A'
        },
        branch: branch ? {
          id: branch.id,
          name: branch.name
        } : {
          id: 'unknown',
          name: 'ไม่ระบุสาขา'
        }
      }
    }) || []

    console.log('Combined material reports:', materialReports.length)

    // Calculate material breakdown (aggregated by material)
    const materialBreakdown = new Map()
    materialReports.forEach(usage => {
      if (!materialBreakdown.has(usage.materialId)) {
        materialBreakdown.set(usage.materialId, {
          materialId: usage.materialId,
          materialName: usage.materialName,
          unit: usage.unit,
          supplier: usage.supplier,
          totalQuantity: 0,
          totalCost: 0,
          usageCount: 0,
          branches: new Set(),
          employees: new Set()
        })
      }
      const material = materialBreakdown.get(usage.materialId)
      material.totalQuantity += usage.quantityUsed
      material.totalCost += usage.totalCost
      material.usageCount += 1
      material.branches.add(usage.branch.id)
      material.employees.add(usage.employee.name)
    })

    // Convert material breakdown to array and format
    const materialSummary = Array.from(materialBreakdown.values())
      .map(material => ({
        ...material,
        branches: Array.from(material.branches),
        employees: Array.from(material.employees),
        averageCostPerUsage: material.usageCount > 0 ? Math.round(material.totalCost / material.usageCount * 100) / 100 : 0,
        averageQuantityPerUsage: material.usageCount > 0 ? Math.round(material.totalQuantity / material.usageCount * 100) / 100 : 0
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    // Calculate branch breakdown (materials by branch)
    const branchBreakdown = new Map()
    materialReports.forEach(usage => {
      if (!branchBreakdown.has(usage.branch.id)) {
        branchBreakdown.set(usage.branch.id, {
          branchId: usage.branch.id,
          branchName: usage.branch.name,
          totalCost: 0,
          usageCount: 0,
          materials: new Set(),
          materialIds: new Set(),
          employees: new Set()
        })
      }
      const branch = branchBreakdown.get(usage.branch.id)
      branch.totalCost += usage.totalCost
      branch.usageCount += 1
      branch.materials.add(usage.materialName)
      branch.materialIds.add(usage.materialId)
      branch.employees.add(usage.employee.name)
    })

    // Convert branch breakdown to array and format
    const branchMaterialUsage = Array.from(branchBreakdown.values())
      .map(branch => ({
        ...branch,
        materials: Array.from(branch.materials),
        materialIds: Array.from(branch.materialIds),
        employees: Array.from(branch.employees),
        averageCostPerUsage: branch.usageCount > 0 ? Math.round(branch.totalCost / branch.usageCount * 100) / 100 : 0
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    // Calculate daily breakdown
    const dailyBreakdown = new Map()
    materialReports.forEach(usage => {
      const date = usage.createdAt.split('T')[0]
      if (!dailyBreakdown.has(date)) {
        dailyBreakdown.set(date, {
          date,
          totalCost: 0,
          usageCount: 0,
          materials: new Set()
        })
      }
      const day = dailyBreakdown.get(date)
      day.totalCost += usage.totalCost
      day.usageCount += 1
      day.materials.add(usage.materialName)
    })

    // Convert daily breakdown to array and format
    const dailyUsage = Array.from(dailyBreakdown.values())
      .map(day => ({
        ...day,
        materials: Array.from(day.materials),
        averageCostPerUsage: day.usageCount > 0 ? Math.round(day.totalCost / day.usageCount * 100) / 100 : 0
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate summary statistics
    const summary = {
      totalCost: materialReports.reduce((sum, usage) => sum + usage.totalCost, 0),
      totalUsageCount: materialReports.length,
      uniqueMaterials: new Set(materialReports.map(usage => usage.materialId)).size,
      uniqueBranches: new Set(materialReports.map(usage => usage.branch.id)).size,
      uniqueEmployees: new Set(materialReports.map(usage => usage.employee.id)).size,
      averageCostPerUsage: materialReports.length > 0 ? 
        Math.round(materialReports.reduce((sum, usage) => sum + usage.totalCost, 0) / materialReports.length * 100) / 100 : 0,
      topMaterial: materialSummary.length > 0 ? materialSummary[0].materialName : null,
      topMaterialCost: materialSummary.length > 0 ? materialSummary[0].totalCost : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        materialBreakdown: materialSummary,
        branchBreakdown: branchMaterialUsage,
        dailyBreakdown: dailyUsage,
        recentUsage: materialReports.slice(0, 20), // Latest 20 usage records
        dateRange: {
          type: dateRange,
          startDate: startDate || dateFilter.split('T')[0],
          endDate: endDate || now.toISOString().split('T')[0]
        }
      }
    })

  } catch (error) {
    console.error('GET /api/admin/reports/materials error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}