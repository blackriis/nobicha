'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
// import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Activity
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
function createFallbackEmployeeData(dateRange: DateRangeFilter) {
  return {
    summary: { totalEmployees: 0, totalHours: 0, activeEmployees: 0, averageHoursPerEmployee: 0 },
    employees: [],
    dateRange: { type: dateRange.type }
  }
}

export function AdminReportsPage() {
  const router = useRouter()
  
  // State management
  const [dateRange, setDateRange] = useState<DateRangeFilter>({ type: 'today' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Data state
  const [summaryData, setSummaryData] = useState<ReportSummary | null>(null)
  const [employeeData, setEmployeeData] = useState<{
    summary: any
    employees: EmployeeReport[]
    dateRange: any
  } | null>(null)
  const [branchData, setBranchData] = useState<{
    summary: any
    branches: BranchReport[]
    dateRange: any
  } | null>(null)
  const [salesData, setSalesData] = useState<SalesReport | null>(null)
  const [materialData, setMaterialData] = useState<MaterialReport | null>(null)

  // Fetch all reports data (memoized)
  const fetchReportsData = useCallback(async (selectedRange: DateRangeFilter) => {
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
        return
      }

      // Fetch all reports in parallel
      const [summaryResult, employeeResult, branchResult, salesResult, materialResult] = await Promise.all([
        adminReportsService.getSummaryReport(selectedRange),
        adminReportsService.getEmployeeReports(selectedRange),
        adminReportsService.getBranchReports(selectedRange),
        adminReportsService.getSalesReports(selectedRange),
        adminReportsService.getMaterialReports(selectedRange)
      ])

      // Update data or fallback if failed
      setSummaryData(summaryResult.success ? summaryResult.data : createFallbackSummary(selectedRange))
      setEmployeeData(employeeResult.success ? employeeResult.data : createFallbackEmployeeData(selectedRange))
      setBranchData(branchResult.success ? branchResult.data : null)
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
      setBranchData(null)
      setSalesData(null)
      setMaterialData(null)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initial data load
  useEffect(() => {
    fetchReportsData(dateRange)
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle date range change (memoized)
  const handleDateRangeChange = useCallback((newRange: DateRangeFilter) => {
    setDateRange(newRange)
    fetchReportsData(newRange)
  }, [fetchReportsData])

  // Handle refresh (memoized)
  const handleRefresh = useCallback(() => {
    fetchReportsData(dateRange)
  }, [fetchReportsData, dateRange])

  // Handle card click (navigate to specific section)
  const handleCardClick = (section: string) => {
    // Scroll to specific section
    const element = document.getElementById(`section-${section}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Handle CSV export (placeholder)
  const handleExportCSV = async () => {
    const { csvExportService } = await import('@/lib/utils/csv-export.utils')
    csvExportService.showExportNotification('summary')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">รายงานและสถิติ</h1>
          <p className="text-muted-foreground">
            ภาพรวมข้อมูลระบบ การวิเคราะห์ และรายงานสำคัญ
          </p>
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
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            ส่งออก CSV
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
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Range Filter */}
      <ReportsDateFilter
        selectedRange={dateRange}
        onRangeChange={handleDateRangeChange}
        isLoading={isLoading}
      />

      {/* Summary Cards */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          สรุปข้อมูลรวม
        </h2>
        <ReportsSummaryCards
          summary={summaryData}
          isLoading={isLoading}
          onCardClick={handleCardClick}
        />
      </section>

      {/* Reports Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Employee Reports */}
        <section id="section-employees">
          <EmployeeReportsSection
            data={employeeData}
            isLoading={isLoading}
            onViewDetails={() => {
              router.push('/admin/time-entries')
            }}
          />
        </section>

        {/* Branch Reports - Placeholder */}
        <section id="section-branches">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle className="text-lg">รายงานสาขา</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    ประสิทธิภาพและยอดขายแต่ละสาขา
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : branchData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">สาขาทั้งหมด</p>
                      <p className="text-xl font-bold text-green-600">
                        {branchData.summary.totalBranches}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
                      <p className="text-xl font-bold text-blue-600">
                        ฿{branchData.summary.totalSales.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full gap-2">
                    <BarChart3 className="h-4 w-4" />
                    ดูรายละเอียดสาขา
                  </Button>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  ไม่มีข้อมูลสาขา
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Sales Reports - Placeholder */}
        <section id="section-sales">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <CardTitle className="text-lg">รายงานการขาย</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    ยอดขายและแนวโน้มการเติบโต
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : salesData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
                      <p className="text-xl font-bold text-orange-600">
                        ฿{salesData.summary.totalSales.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">รายงานทั้งหมด</p>
                      <p className="text-xl font-bold text-purple-600">
                        {salesData.summary.totalReports}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full gap-2">
                    <DollarSign className="h-4 w-4" />
                    ดูรายละเอียดการขาย
                  </Button>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  ไม่มีข้อมูลการขาย
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Material Reports - Placeholder */}
        <section id="section-materials">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <CardTitle className="text-lg">รายงานวัตถุดิบ</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    การใช้งานและต้นทุนวัตถุดิบ
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : materialData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">ต้นทุนรวม</p>
                      <p className="text-xl font-bold text-purple-600">
                        ฿{materialData.summary.totalCost.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">การใช้งานทั้งหมด</p>
                      <p className="text-xl font-bold text-pink-600">
                        {materialData.summary.totalUsageCount}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
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
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  ไม่มีข้อมูลวัตถุดิบ
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground pt-8 border-t">
        <p>ข้อมูลรายงานอัพเดทแบบ Real-time • สร้างเมื่อ {formatRefreshTime(lastRefresh)}</p>
      </div>
    </div>
  )
}