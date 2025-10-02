'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Package,
  Building2,
  Users,
  DollarSign,
  Activity
} from 'lucide-react'

// Import components
import { ReportsDateFilter } from './ReportsDateFilter'
import { BranchFilter } from './BranchFilter'
import { MaterialDetailSummary } from './MaterialDetailSummary'
import { MaterialBranchBreakdown } from './MaterialBranchBreakdown'
import { MaterialUsageTable } from './MaterialUsageTable'

// Import service and types
import { 
  adminReportsService, 
  type DateRangeFilter,
  type MaterialReport
} from '@/lib/services/admin-reports.service'

export function MaterialDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get date range and branch from URL params
  const getInitialDateRange = (): DateRangeFilter => {
    const dateRangeType = searchParams.get('dateRange') || 'today'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    return {
      type: dateRangeType as DateRangeFilter['type'],
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }
  }
  
  const getInitialBranchId = (): string | null => {
    return searchParams.get('branchId')
  }
  
  // State management
  const [dateRange, setDateRange] = useState<DateRangeFilter>(getInitialDateRange())
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(getInitialBranchId())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [materialData, setMaterialData] = useState<MaterialReport | null>(null)

  // Fetch material reports data
  const fetchMaterialData = async (selectedRange: DateRangeFilter, branchId: string | null = null) => {
    console.log('🔄 Fetching material data:', { selectedRange, branchId })
    setIsLoading(true)
    setError(null)

    try {
      // Validate date range first
      const validation = adminReportsService.validateDateRange(selectedRange)
      if (!validation.valid) {
        console.log('❌ Date range validation failed:', validation.error)
        setError(validation.error || 'ช่วงเวลาไม่ถูกต้อง')
        setIsLoading(false)
        return
      }

      console.log('✅ Date range valid, calling API...')
      const result = await adminReportsService.getMaterialReports(selectedRange, branchId)
      console.log('📊 API result:', { success: result.success, error: result.error, hasData: !!result.data })

      if (result.success && result.data) {
        setMaterialData(result.data)
        setLastRefresh(new Date())
      } else {
        setError(result.error || 'ไม่สามารถดึงข้อมูลรายงานวัตถุดิบได้')
      }

    } catch (err) {
      console.error('Fetch material data error:', err)
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลรายงานวัตถุดิบ')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchMaterialData(dateRange, selectedBranchId)
  }, [])

  // Handle date range change
  const handleDateRangeChange = (newRange: DateRangeFilter) => {
    setDateRange(newRange)
    fetchMaterialData(newRange, selectedBranchId)
    
    // Update URL params
    const params = new URLSearchParams()
    params.set('dateRange', newRange.type)
    if (newRange.startDate) params.set('startDate', newRange.startDate)
    if (newRange.endDate) params.set('endDate', newRange.endDate)
    if (selectedBranchId) params.set('branchId', selectedBranchId)
    
    const newUrl = `/admin/reports/materials?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }

  // Handle branch change
  const handleBranchChange = (branchId: string | null) => {
    setSelectedBranchId(branchId)
    fetchMaterialData(dateRange, branchId)
    
    // Update URL params
    const params = new URLSearchParams()
    params.set('dateRange', dateRange.type)
    if (dateRange.startDate) params.set('startDate', dateRange.startDate)
    if (dateRange.endDate) params.set('endDate', dateRange.endDate)
    if (branchId) params.set('branchId', branchId)
    
    const newUrl = `/admin/reports/materials?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchMaterialData(dateRange, selectedBranchId)
  }

  // Handle back navigation
  const handleBackToReports = () => {
    const params = new URLSearchParams()
    params.set('dateRange', dateRange.type)
    if (dateRange.startDate) params.set('startDate', dateRange.startDate)
    if (dateRange.endDate) params.set('endDate', dateRange.endDate)
    
    router.push(`/admin/reports?${params.toString()}`)
  }

  const formatRefreshTime = (date: Date): string => {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToReports}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปรายงานหลัก
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">รายละเอียดวัตถุดิบ</h1>
            <p className="text-muted-foreground">
              การใช้งานและต้นทุนวัตถุดิบแยกตามสาขาและช่วงเวลา
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            อัพเดทล่าสุด: {formatRefreshTime(lastRefresh)}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </div>

      <Separator />

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <span className="text-sm font-medium">เกิดข้อผิดพลาด:</span>
                <p className="text-sm">{error}</p>
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer">รายละเอียดเพิ่มเติม</summary>
                  <pre className="text-xs mt-1 p-2 bg-red-100 rounded overflow-auto">
                    {JSON.stringify({ dateRange, lastRefresh }, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-lg border border-gray-100">
        <ReportsDateFilter
          selectedRange={dateRange}
          onRangeChange={handleDateRangeChange}
          isLoading={isLoading}
        />
        
        <BranchFilter
          selectedBranchId={selectedBranchId}
          onBranchChange={handleBranchChange}
          isLoading={isLoading}
        />
      </div>

      {/* Summary Cards */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            สรุปข้อมูลวัตถุดิบ
          </h2>
        </div>
        <MaterialDetailSummary
          summary={materialData?.summary || null}
          isLoading={isLoading}
        />
      </section>

      {/* Branch Breakdown */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            การใช้วัตถุดิบแยกตามสาขา
          </h2>
        </div>
        <MaterialBranchBreakdown
          branches={materialData?.branchBreakdown || []}
          isLoading={isLoading}
        />
      </section>

      {/* Material Usage Table */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            รายละเอียดการใช้วัตถุดิบ
          </h2>
        </div>
        <MaterialUsageTable
          materials={materialData?.materialBreakdown || []}
          isLoading={isLoading}
        />
      </section>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground pt-8 border-t">
        <p>ข้อมูลรายงานอัพเดทแบบ Real-time • สร้างเมื่อ {formatRefreshTime(lastRefresh)}</p>
      </div>
    </div>
  )
}