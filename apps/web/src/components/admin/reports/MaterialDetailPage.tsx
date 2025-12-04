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
 Activity,
 X
} from 'lucide-react'

// Import components
import { ReportsDateFilter } from './ReportsDateFilter'
import { BranchFilter } from './BranchFilter'
import { MaterialDetailSummary } from './MaterialDetailSummary'
import { MaterialBranchBreakdown } from './MaterialBranchBreakdown'
import { MaterialUsageTable } from './MaterialUsageTable'
import { MaterialTrendChart, type MonthlyTrendData } from './MaterialTrendChart'

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
  const branchId = searchParams.get('branchId')
  // Validate branchId - should be null, UUID format, or valid ID
  if (!branchId || branchId === 'unknown' || branchId === 'null' || branchId === 'undefined') {
   return null
  }
  return branchId
 }
 
 // State management
 const [dateRange, setDateRange] = useState<DateRangeFilter>(getInitialDateRange())
 const [selectedBranchId, setSelectedBranchId] = useState<string | null>(getInitialBranchId())
 const [isLoading, setIsLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
 const [materialData, setMaterialData] = useState<MaterialReport | null>(null)

 // Trend chart state
 const [trendData, setTrendData] = useState<MonthlyTrendData[]>([])
 const [trendPeriod, setTrendPeriod] = useState<'last3months' | 'last6months' | 'last12months'>('last3months')
 const [isTrendLoading, setIsTrendLoading] = useState(false)

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

 // Fetch trend data
 const fetchTrendData = async (period: 'last3months' | 'last6months' | 'last12months', branchId: string | null = null) => {
  setIsTrendLoading(true)
  try {
   const monthsMap = {
    'last3months': 3,
    'last6months': 6,
    'last12months': 12
   }
   const months = monthsMap[period]

   const result = await adminReportsService.getMaterialMonthlyTrend(months, branchId)

   if (result.success && result.data) {
    setTrendData(result.data)
   } else {
    console.error('Failed to fetch trend data:', result.error)
    setTrendData([])
   }
  } catch (err) {
   console.error('Trend data fetch error:', err)
   setTrendData([])
  } finally {
   setIsTrendLoading(false)
  }
 }

 // Handle trend period change
 const handleTrendPeriodChange = (period: 'last3months' | 'last6months' | 'last12months') => {
  setTrendPeriod(period)
  fetchTrendData(period, selectedBranchId)
 }

 // Initial data load
 useEffect(() => {
  fetchMaterialData(dateRange, selectedBranchId)
  fetchTrendData(trendPeriod, selectedBranchId)
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
  fetchTrendData(trendPeriod, branchId)

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
  fetchTrendData(trendPeriod, selectedBranchId)
 }

 // Handle back navigation
 const handleBackToReports = () => {
  const params = new URLSearchParams()
  params.set('dateRange', dateRange.type)
  if (dateRange.startDate) params.set('startDate', dateRange.startDate)
  if (dateRange.endDate) params.set('endDate', dateRange.endDate)

  router.push(`/admin/reports?${params.toString()}`)
 }

 // Handle branch card click (toggle behavior)
 const handleBranchCardClick = (branchId: string) => {
  const newBranchId = selectedBranchId === branchId ? null : branchId
  handleBranchChange(newBranchId)
 }

 const formatRefreshTime = (date: Date): string => {
  return date.toLocaleTimeString('th-TH', {
   hour: '2-digit',
   minute: '2-digit',
   second: '2-digit'
  })
 }

 return (
  <div className="space-y-8 bg-background text-foreground">
   {/* Header Section */}
   <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
     <Button
      variant="ghost"
      size="sm"
      onClick={handleBackToReports}
      className="gap-2 hover:bg-accent focus-visible:ring-ring"
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
     <Badge variant="outline" className="gap-1 hover:bg-accent focus-visible:ring-ring">
      <Activity className="h-3 w-3" />
      อัพเดทล่าสุด: {formatRefreshTime(lastRefresh)}
     </Badge>
     
     <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRefresh}
      disabled={isLoading}
      className="gap-2 hover:bg-accent focus-visible:ring-ring"
     >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      รีเฟรช
     </Button>
    </div>
   </div>

   <Separator />

   {/* Error Alert */}
   {error && (
    <Card className="border-destructive/20 bg-destructive/10 text-destructive">
     <CardContent className="p-4">
      <div className="flex items-center gap-2">
       <AlertCircle className="h-4 w-4" />
       <div className="flex-1">
        <span className="text-sm font-medium">เกิดข้อผิดพลาด:</span>
        <p className="text-sm">{error}</p>
        <details className="mt-2">
         <summary className="text-xs cursor-pointer">รายละเอียดเพิ่มเติม</summary>
         <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto text-muted-foreground">
          {JSON.stringify({ dateRange, lastRefresh }, null, 2)}
         </pre>
        </details>
       </div>
      </div>
     </CardContent>
    </Card>
   )}

   {/* Filters */}
   <div className="space-y-6 bg-background text-foreground">
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

   {/* Summary Section */}
   <section className="bg-background text-foreground">
    <div className="flex items-center gap-3 mb-6">
     <div className="p-2 bg-accent text-accent-foreground rounded-lg">
      <Package className="h-5 w-5" />
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

   {/* Trend Chart Section */}
   <section className="bg-background text-foreground">
    <MaterialTrendChart
     data={trendData}
     isLoading={isTrendLoading}
     selectedPeriod={trendPeriod}
     onPeriodChange={handleTrendPeriodChange}
    />
   </section>

   {/* Branch Breakdown */}
   <section className="bg-background text-foreground">
    <div className="flex items-center gap-3 mb-6">
     <div className="p-2 bg-accent text-accent-foreground rounded-lg">
      <Building2 className="h-5 w-5" />
     </div>
     <h2 className="text-xl font-semibold tracking-tight">
      การใช้วัตถุดิบแยกตามสาขา
     </h2>
     {selectedBranchId && (
      <Button
       variant="ghost"
       size="sm"
       onClick={() => handleBranchChange(null)}
       className="gap-2 text-blue-600 hover:bg-accent focus-visible:ring-ring"
      >
       <X className="h-4 w-4" />
       แสดงทุกสาขา
      </Button>
     )}
    </div>
    <MaterialBranchBreakdown
     branches={materialData?.branchBreakdown || []}
     isLoading={isLoading}
     selectedBranchId={selectedBranchId}
     onBranchClick={handleBranchCardClick}
    />
   </section>

   {/* Material Usage Table */}
   <section className="bg-background text-foreground">
    <div className="flex items-center gap-3 mb-6">
     <div className="p-2 bg-accent text-accent-foreground rounded-lg">
      <DollarSign className="h-5 w-5" />
     </div>
     <h2 className="text-xl font-semibold tracking-tight">
      รายละเอียดการใช้วัตถุดิบ
     </h2>
    </div>
    <MaterialUsageTable
     materials={materialData?.materialBreakdown || []}
     isLoading={isLoading}
     selectedBranchId={selectedBranchId}
    />
   </section>

   {/* Footer Info */}
   <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border bg-background">
    <p>ข้อมูลรายงานอัพเดทแบบ Real-time • สร้างเมื่อ {formatRefreshTime(lastRefresh)}</p>
   </div>
  </div>
 )
}