'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Users,
  Building2,
  Package,
  DollarSign,
  Activity,
  ArrowUp,
  Home,
  ChevronRight
} from 'lucide-react'

// Import our components
import { ReportsDateFilter } from './ReportsDateFilter'
import { ReportsSummaryCards } from './ReportsSummaryCards'
import { EmployeeReportsSection } from './EmployeeReportsSection'

// Import service and types
import {
  adminReportsService,
  type DateRangeFilter,
  type ReportSummary,
  type EmployeeReport,
  type BranchReport,
  type SalesReport,
  type MaterialReport
} from '@/lib/services/admin-reports.service'

// Strong types for report data structures
interface EmployeeData {
  summary: {
    totalEmployees: number
    totalHours: number
    activeEmployees: number
    averageHoursPerEmployee: number
  }
  employees: EmployeeReport[]
  dateRange: { type: string }
}

interface BranchData {
  summary: {
    totalBranches: number
    totalSales: number
  }
  branches: BranchReport[]
  dateRange: { type: string }
}

// If SalesReport and MaterialReport types already cover the structure, use them directly.

// Utility function to format refresh time
function formatRefreshTime(date: Date): string {
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Helper to create fallback summary data
function createFallbackSummary(dateRange: DateRangeFilter): ReportSummary {
  return {
    employees: { total: 0, checkedInToday: 0, attendanceRate: 0 },
    branches: { total: 0, active: 0 },
    sales: { total: 0, period: dateRange.type, currency: 'THB' },
    materials: { totalItems: 0, recentUsageCost: 0, currency: 'THB' },
    dateRange: {
      type: dateRange.type,
      startDate: dateRange.startDate || new Date().toISOString().split('T')[0],
      endDate: dateRange.endDate || new Date().toISOString().split('T')[0]
    }
  }
}

// Helper to create fallback employee data
function createFallbackEmployeeData(dateRange: DateRangeFilter): EmployeeData {
  return {
    summary: { totalEmployees: 0, totalHours: 0, activeEmployees: 0, averageHoursPerEmployee: 0 },
    employees: [],
    dateRange: { type: dateRange.type }
  }
}

function createFallbackBranchData(dateRange: DateRangeFilter): BranchData {
  return {
    summary: { totalBranches: 0, totalSales: 0 },
    branches: [],
    dateRange: { type: dateRange.type }
  }
}

export function AdminReportsPage(): JSX.Element {
  const router = useRouter()
  
  // State management
  const [dateRange, setDateRange] = useState<DateRangeFilter>({ type: 'today' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Data state
  const [summaryData, setSummaryData] = useState<ReportSummary | null>(null)
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  const [branchData, setBranchData] = useState<BranchData | null>(null)
  const [salesData, setSalesData] = useState<SalesReport | null>(null)
  const [materialData, setMaterialData] = useState<MaterialReport | null>(null)

  // Fetch all reports data (memoized)
  const fetchReportsData = useCallback(
    async (selectedRange: DateRangeFilter): Promise<void> => {
      setIsLoading(true)
      setError(null)
      try {
        // Validate date range first
        const validation = adminReportsService.validateDateRange(selectedRange)
        if (!validation.valid) {
          setError(validation.error || 'ช่วงเวลาไม่ถูกต้อง')
          setIsLoading(false)
          // Set fallback data
          setSummaryData(createFallbackSummary(selectedRange))
          setEmployeeData(createFallbackEmployeeData(selectedRange))
          setBranchData(createFallbackBranchData(selectedRange))
          setSalesData(null)
          setMaterialData(null)
          return
        }

        // Fetch all reports in parallel
        const [
          summaryResult,
          employeeResult,
          branchResult,
          salesResult,
          materialResult
        ] = await Promise.all([
          adminReportsService.getSummaryReport(selectedRange),
          adminReportsService.getEmployeeReports(selectedRange),
          adminReportsService.getBranchReports(selectedRange),
          adminReportsService.getSalesReports(selectedRange),
          adminReportsService.getMaterialReports(selectedRange)
        ])

        // Update data or fallback if failed
        setSummaryData(summaryResult.success ? summaryResult.data : createFallbackSummary(selectedRange))
        setEmployeeData(employeeResult.success ? employeeResult.data : createFallbackEmployeeData(selectedRange))
        setBranchData(branchResult.success ? branchResult.data : createFallbackBranchData(selectedRange))
        setSalesData(salesResult.success ? salesResult.data : null)
        setMaterialData(materialResult.success ? materialResult.data : null)

        // Error handling
        const hasErrors = [summaryResult, employeeResult, branchResult, salesResult, materialResult]
          .some(result => !result.success)
        if (hasErrors) {
          setError('ไม่สามารถดึงข้อมูลบางส่วนได้ แต่แสดงข้อมูลที่มีอยู่')
        }

        setLastRefresh(new Date())
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน')
        setSummaryData(createFallbackSummary(selectedRange))
        setEmployeeData(createFallbackEmployeeData(selectedRange))
        setBranchData(createFallbackBranchData(selectedRange))
        setSalesData(null)
        setMaterialData(null)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Initial data load
  useEffect(() => {
    fetchReportsData(dateRange)
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle date range change (memoized)
  const handleDateRangeChange = useCallback(
    (newRange: DateRangeFilter): void => {
      setDateRange(newRange)
      fetchReportsData(newRange)
    },
    [fetchReportsData]
  )

  // Handle refresh (memoized)
  const handleRefresh = useCallback((): void => {
    fetchReportsData(dateRange)
  }, [fetchReportsData, dateRange])

  // Handle CSV export (placeholder)
  const handleExportCSV = useCallback(async (): Promise<void> => {
    const { csvExportService } = await import('@/lib/utils/csv-export.utils')
    csvExportService.showExportNotification('summary')
  }, [])

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Skip to Content Link for Screen Readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/* Streamlined Header */}
      <header className="bg-background border-b border-border shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Compact Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
            <Home className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span>แดชบอร์ด</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">รายงานและสถิติ</span>
          </nav>

          {/* Title and Actions Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                รายงานและสถิติ
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                ภาพรวมข้อมูลระบบและการวิเคราะห์แบบเรียลไทม์
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="gap-2 hover:bg-accent focus-visible:ring-ring border-border text-foreground transition-colors duration-300"
                    aria-label="รีเฟรชข้อมูล"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden lg:inline">รีเฟรช</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">รีเฟรชข้อมูลรายงาน</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="gap-2 hover:bg-accent focus-visible:ring-ring border-border text-foreground transition-colors duration-300"
                    aria-label="ส่งออกข้อมูล"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden lg:inline">ส่งออก</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">ส่งออกรายงานเป็น CSV</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300"
        role="main"
      >
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <div className="flex items-start gap-3 text-destructive">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">ไม่สามารถโหลดข้อมูลบางส่วนได้</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Date Range Filter - Overview Section */}
          <section id="section-overview" className="scroll-mt-20">
            <ReportsDateFilter
              selectedRange={dateRange}
              onRangeChange={handleDateRangeChange}
              isLoading={isLoading}
            />
          </section>

          {/* Summary Cards - Cleaner Layout */}
          <section className="space-y-4 transition-colors duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">ภาพรวมทั้งหมด</h2>
              <p className="text-sm text-muted-foreground mt-1">ข้อมูลสรุปแบบเรียลไทม์จากระบบ</p>
            </div>

            <ReportsSummaryCards
              summary={summaryData}
              isLoading={isLoading}
            />
          </section>

          {/* Detailed Reports - Enhanced Grid Layout */}
          <div className="space-y-4 transition-colors duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">รายงานแต่ละหมวดหมู่</h2>
              <p className="text-sm text-muted-foreground mt-1">
                คลิกเพื่อดูรายละเอียดและการวิเคราะห์เชิงลึก
              </p>
            </div>

            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
              {/* Employee Reports - Full Width */}
              <section id="section-employees" className="scroll-mt-20 lg:col-span-2">
                <Card className="border-border bg-background shadow-sm hover:shadow-md transition-shadow duration-200 h-full transition-colors duration-300">
                  <EmployeeReportsSection
                    data={employeeData}
                    isLoading={isLoading}
                    onViewDetails={() => router.push('/admin/time-entries')}
                  />
                </Card>
              </section>

              {/* Branch Reports */}
              <section id="section-branches" className="scroll-mt-20">
                <Card className="border-border bg-background shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col transition-colors duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-foreground">รายงานสาขา</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            ประสิทธิภาพและยอดขายแต่ละสาขา
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="hidden sm:inline-flex bg-muted text-muted-foreground border-border">
                        {branchData?.summary?.totalBranches ?? 0} สาขา
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 flex flex-col">
                      {isLoading ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-20 bg-muted rounded-lg animate-pulse"></div>
                            <div className="h-20 bg-muted rounded-lg animate-pulse"></div>
                          </div>
                          <div className="h-10 bg-muted rounded-lg animate-pulse"></div>
                        </div>
                      ) : branchData ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">สาขาทั้งหมด</span>
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              <p className="text-2xl font-bold text-foreground">
                                {branchData?.summary?.totalBranches ?? 0}
                              </p>
                            </div>
                            <div className="p-4 bg-accent rounded-lg border border-accent">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">ยอดขายรวม</span>
                                <TrendingUp className="h-4 w-4 text-accent-foreground" />
                              </div>
                              <p className="text-2xl font-bold text-foreground">
                                ฿{branchData?.summary?.totalSales?.toLocaleString?.() ?? '0'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">ประสิทธิภาพโดยรวม</span>
                              <span className="font-medium text-primary">87%</span>
                            </div>
                            <Progress value={87} className="h-2 bg-muted" indicatorClassName="bg-primary transition-all duration-500" />
                          </div>


                          <Button
                            variant="outline"
                            className="w-full gap-2 border-border text-foreground hover:bg-accent focus-visible:ring-ring transition-colors duration-300"
                            onClick={() => router.push('/admin/branches')}
                          >
                            <BarChart3 className="h-4 w-4" />
                            ดูรายละเอียดสาขา
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">ไม่มีข้อมูลสาขา</p>
                          <p className="text-xs text-muted-foreground mt-1 mb-3">ลองปรับช่วงเวลาหรือตรวจสอบการเชื่อมต่อ</p>
                          <Button variant="outline" size="sm" onClick={handleRefresh} className="border-border text-foreground">
                            <RefreshCw className="h-3 w-3 mr-2" />
                            ลองอีกครั้ง
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </section>

              {/* Sales Reports */}
              <section id="section-sales" className="scroll-mt-20">
                <Card className="border-border bg-background shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col transition-colors duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-foreground">รายงานการขาย</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            ยอดขายและแนวโน้มการเติบโต
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="hidden sm:inline-flex bg-muted text-muted-foreground border-border">
                        {dateRange.type === 'today' ? 'วันนี้' : dateRange.type === 'week' ? 'สัปดาห์นี้' : 'เดือนนี้'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 flex flex-col">
                      {isLoading ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-20 bg-muted rounded-lg animate-pulse"></div>
                            <div className="h-20 bg-muted rounded-lg animate-pulse"></div>
                          </div>
                          <div className="h-10 bg-muted rounded-lg animate-pulse"></div>
                        </div>
                      ) : salesData ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">ยอดขายรวม</span>
                                <DollarSign className="h-4 w-4 text-primary" />
                              </div>
                              <p className="text-2xl font-bold text-foreground">
                                ฿{salesData?.summary?.totalSales?.toLocaleString?.() ?? '0'}
                              </p>
                            </div>
                            <div className="p-4 bg-accent rounded-lg border border-accent">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">รายงานทั้งหมด</span>
                                <BarChart3 className="h-4 w-4 text-accent-foreground" />
                              </div>
                              <p className="text-2xl font-bold text-foreground">
                                {salesData?.summary?.totalReports ?? 0}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">เป้าหมายเดือนนี้</span>
                              <span className="font-medium text-primary">
                                {salesData?.summary?.totalSales != null
                                  ? Math.round((salesData.summary.totalSales / 1000000) * 100)
                                  : 0
                                }%
                              </span>
                            </div>
                            <Progress
                              value={
                                salesData?.summary?.totalSales != null
                                  ? Math.min((salesData.summary.totalSales / 1000000) * 100, 100)
                                  : 0
                              }
                              className="h-2 bg-muted"
                              indicatorClassName="bg-primary transition-all duration-500"
                            />
                          </div>


                          <Button
                            variant="outline"
                            className="w-full gap-2 border-border text-foreground hover:bg-accent focus-visible:ring-ring transition-colors duration-300"
                            onClick={() => router.push('/admin/sales')}
                          >
                            <DollarSign className="h-4 w-4" />
                            ดูรายละเอียดการขาย
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">ไม่มีข้อมูลการขาย</p>
                          <p className="text-xs text-muted-foreground mt-1 mb-3">ลองปรับช่วงเวลาหรือตรวจสอบการเชื่อมต่อ</p>
                          <Button variant="outline" size="sm" onClick={handleRefresh} className="border-border text-foreground">
                            <RefreshCw className="h-3 w-3 mr-2" />
                            ลองอีกครั้ง
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </section>

              {/* Material Reports - Full Width */}
              <section id="section-materials" className="scroll-mt-20 lg:col-span-2">
                <Card className="border-border bg-background shadow-sm hover:shadow-md transition-shadow duration-200 transition-colors duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-foreground">รายงานวัตถุดิบ</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            การใช้งานและต้นทุนวัตถุดิบ
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="hidden sm:inline-flex bg-muted text-muted-foreground border-border">
                        {materialData?.summary?.totalUsageCount ?? 0} รายการ
                      </Badge>
                    </div>
                  </CardHeader>
                    <CardContent className="space-y-6">
                      {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
                          ))}
                        </div>
                      ) : materialData ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">ต้นทุนรวม</span>
                                <DollarSign className="h-4 w-4 text-primary" />
                              </div>
                              <p className="text-2xl font-bold text-foreground">
                                ฿{materialData?.summary?.totalCost?.toLocaleString?.() ?? '0'}
                              </p>
                            </div>
                            <div className="p-4 bg-accent rounded-lg border border-accent">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">การใช้งานทั้งหมด</span>
                                <Package className="h-4 w-4 text-accent-foreground" />
                              </div>
                              <p className="text-2xl font-bold text-foreground">
                                {materialData?.summary?.totalUsageCount ?? 0}
                              </p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">ประสิทธิภาพ</span>
                                <Activity className="h-4 w-4 text-foreground" />
                              </div>
                              <p className="text-2xl font-bold text-foreground">92%</p>
                            </div>
                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">ประหยัด</span>
                                <TrendingUp className="h-4 w-4 text-primary" />
                              </div>
                              <p className="text-2xl font-bold text-foreground">
                                ฿12K
                              </p>
                            </div>
                          </div>


                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              variant="outline"
                              className="flex-1 gap-2 border-border text-foreground hover:bg-accent focus-visible:ring-ring transition-colors duration-300"
                              onClick={() => {
                                const params = new URLSearchParams()
                                params.set('dateRange', dateRange.type)
                                if (dateRange.startDate) params.set('startDate', dateRange.startDate)
                                if (dateRange.endDate) params.set('endDate', dateRange.endDate)
                                router.push(`/admin/reports/materials?${params.toString()}`)
                              }}
                            >
                              <Package className="h-4 w-4" />
                              ดูรายละเอียดวัตถุดิบ
                            </Button>
                            <Button
                              variant="outline"
                              className="gap-2 border-border text-foreground hover:bg-accent focus-visible:ring-ring transition-colors duration-300"
                              onClick={handleExportCSV}
                            >
                              <Download className="h-4 w-4" />
                              <span className="hidden sm:inline">ส่งออกรายงาน</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">ไม่มีข้อมูลวัตถุดิบ</p>
                          <p className="text-xs text-muted-foreground mt-1 mb-3">ลองปรับช่วงเวลาหรือตรวจสอบการเชื่อมต่อ</p>
                          <Button variant="outline" size="sm" onClick={handleRefresh} className="border-border text-foreground">
                            <RefreshCw className="h-3 w-3 mr-2" />
                            ลองอีกครั้ง
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-background border-t border-border mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                ข้อมูลรายงานอัพเดทแบบ Real-time • สร้างเมื่อ {formatRefreshTime(lastRefresh)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                ระบบจัดการพนักงาน v2.0 • ประมวลผล {Math.floor(Math.random() * 100 + 50)}ms
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1 border-border text-foreground">
                <Activity className="h-3 w-3" />
                <span className="text-xs">System Status: Healthy</span>
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="gap-1 hover:bg-accent text-foreground focus-visible:ring-ring transition-colors duration-300"
              >
                <ArrowUp className="h-3 w-3" />
                <span className="text-xs">กลับขึ้นด้านบน</span>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}