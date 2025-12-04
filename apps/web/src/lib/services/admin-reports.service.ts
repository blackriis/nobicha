// import type { Database } from '@employee-management/database'
import { createClientComponentClient } from '../supabase'

// Type definitions for report data
export interface DateRangeFilter {
  type: 'all' | 'today' | 'week' | 'month' | 'custom'
  startDate?: string
  endDate?: string
}

export interface ReportSummary {
  employees: {
    total: number
    checkedInToday: number
    attendanceRate: number
  }
  branches: {
    total: number
    active: number
  }
  sales: {
    total: number
    period: string
    currency: string
  }
  materials: {
    totalItems: number
    recentUsageCost: number
    currency: string
  }
  dateRange: DateRangeFilter & {
    startDate: string
    endDate: string
  }
}

export interface EmployeeReport {
  userId: string
  fullName: string
  employeeId: string
  totalHours: number
  totalSessions: number
  averageHoursPerSession: number
  branches: string[]
  status: 'working' | 'offline'
  lastCheckIn: string | null
}

export interface BranchReport {
  branchId: string
  branchName: string
  address: string
  sales: {
    total: number
    currency: string
  }
  employees: {
    total: number
    activeToday: number
    attendanceRate: number
  }
  workHours: {
    total: number
    sessions: number
    averagePerSession: number
  }
  performance: {
    salesPerEmployee: number
    salesPerHour: number
  }
}

export interface SalesReport {
  summary: {
    totalSales: number
    totalReports: number
    uniqueBranches: number
    uniqueEmployees: number
    averageSalePerReport: number
    topPerformingBranch: string | null
    topPerformingBranchSales: number
  }
  dailyBreakdown: Array<{
    date: string
    totalSales: number
    reportCount: number
    branches: string[]
    averageSalePerReport: number
  }>
  branchBreakdown: Array<{
    branchId: string
    branchName: string
    totalSales: number
    reportCount: number
    employees: string[]
    averageSalePerReport: number
  }>
  recentReports: Array<{
    id: string
    branchId: string
    branchName: string
    userId: string
    employeeName: string
    employeeId: string
    reportDate: string
    totalSales: number
    createdAt: string
  }>
}

export interface MaterialReport {
  summary: {
    totalCost: number
    totalUsageCount: number
    uniqueMaterials: number
    uniqueBranches: number
    uniqueEmployees: number
    averageCostPerUsage: number
    topMaterial: string | null
    topMaterialCost: number
  }
  materialBreakdown: Array<{
    materialId: string
    materialName: string
    unit: string
    supplier: string
    totalQuantity: number
    totalCost: number
    usageCount: number
    branches: string[]
    employees: string[]
    averageCostPerUsage: number
    averageQuantityPerUsage: number
  }>
  branchBreakdown: Array<{
    branchId: string
    branchName: string
    totalCost: number
    usageCount: number
    materials: string[]
    materialIds: string[]
    employees: string[]
    averageCostPerUsage: number
  }>
  dailyBreakdown: Array<{
    date: string
    totalCost: number
    usageCount: number
    materials: string[]
    averageCostPerUsage: number
  }>
}

export interface MonthlyTrendData {
  month: string // Format: "YYYY-MM"
  monthLabel: string // Display label: "ม.ค. 2025"
  totalCost: number
  totalUsageCount: number
  uniqueMaterialsUsed: number
}

export interface AdminReportsServiceResult<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

class AdminReportsService {
  private getClient() {
    return createClientComponentClient()
  }

  // Calculate date range filter for API calls
  private formatDateRange(dateRange: DateRangeFilter): string {
    const params = new URLSearchParams()
    params.set('dateRange', dateRange.type)
    
    if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
      params.set('startDate', dateRange.startDate)
      params.set('endDate', dateRange.endDate)
    }
    
    return params.toString()
  }

  // Utility function to format Thai dates
  formatDateForDisplay(dateString: string): string {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return '--/--/----'
      }
      
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch (error) {
      console.error('Date formatting error:', error)
      return '--/--/----'
    }
  }

  // Utility function to format Thai currency
  formatCurrency(amount: number): string {
    try {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      console.error('Currency formatting error:', error)
      return `฿${amount.toLocaleString()}`
    }
  }

  // Utility function to format decimal numbers
  formatDecimal(number: number, decimals: number = 2): number {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  // Get overall summary statistics
  async getSummaryReport(dateRange: DateRangeFilter, branchId: string | null = null): Promise<AdminReportsServiceResult<ReportSummary>> {
    try {
      const queryParams = new URLSearchParams(this.formatDateRange(dateRange))
      if (branchId) {
        queryParams.append('branchId', branchId)
      }
      const url = `/api/admin/reports/summary?${queryParams.toString()}`
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        return {
          data: null,
          error: errorData.error || 'ไม่สามารถดึงข้อมูลสรุปรายงานได้',
          success: false
        }
      }

      const result = await response.json()
      return {
        data: result.data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Summary report service error:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปรายงาน',
        success: false
      }
    }
  }

  // Get employee work reports
  async getEmployeeReports(dateRange: DateRangeFilter, branchId: string | null = null, limit: number = 50): Promise<AdminReportsServiceResult<{
    summary: Record<string, unknown>
    employees: EmployeeReport[]
    dateRange: Record<string, unknown>
  }>> {
    try {
      const queryParams = new URLSearchParams(this.formatDateRange(dateRange))
      if (branchId) {
        queryParams.append('branchId', branchId)
      }
      queryParams.append('limit', limit.toString())
      const response = await fetch(`/api/admin/reports/employees?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return {
          data: null,
          error: errorData.error || 'ไม่สามารถดึงข้อมูลรายงานพนักงานได้',
          success: false
        }
      }

      const result = await response.json()
      return {
        data: result.data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Employee reports service error:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานพนักงาน',
        success: false
      }
    }
  }

  // Get branch performance reports
  async getBranchReports(dateRange: DateRangeFilter, branchId: string | null = null): Promise<AdminReportsServiceResult<{
    summary: Record<string, unknown>
    branches: BranchReport[]
    dateRange: Record<string, unknown>
  }>> {
    try {
      const queryParams = new URLSearchParams(this.formatDateRange(dateRange))
      if (branchId) {
        queryParams.append('branchId', branchId)
      }
      const response = await fetch(`/api/admin/reports/branches?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return {
          data: null,
          error: errorData.error || 'ไม่สามารถดึงข้อมูลรายงานสาขาได้',
          success: false
        }
      }

      const result = await response.json()
      return {
        data: result.data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Branch reports service error:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานสาขา',
        success: false
      }
    }
  }

  // Get sales reports
  async getSalesReports(dateRange: DateRangeFilter, branchId: string | null = null, limit: number = 100): Promise<AdminReportsServiceResult<SalesReport>> {
    try {
      const queryParams = new URLSearchParams(this.formatDateRange(dateRange))
      if (branchId) {
        queryParams.append('branchId', branchId)
      }
      queryParams.append('limit', limit.toString())
      const response = await fetch(`/api/admin/reports/sales?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return {
          data: null,
          error: errorData.error || 'ไม่สามารถดึงข้อมูลรายงานการขายได้',
          success: false
        }
      }

      const result = await response.json()
      return {
        data: result.data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Sales reports service error:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานการขาย',
        success: false
      }
    }
  }

  // Get material usage reports
  async getMaterialReports(
    dateRange: DateRangeFilter,
    branchId: string | null = null,
    limit: number = 100
  ): Promise<AdminReportsServiceResult<MaterialReport>> {
    try {
      const queryParams = new URLSearchParams(this.formatDateRange(dateRange))
      if (branchId) {
        queryParams.append('branchId', branchId)
      }
      queryParams.append('limit', limit.toString())

      const url = `/api/admin/reports/materials?${queryParams.toString()}`

      console.log('🌐 Making materials API request:', { url, dateRange, branchId, limit })

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('🔍 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.log('❌ API Error:', errorData)
        return {
          data: null,
          error: errorData.error || 'ไม่สามารถดึงข้อมูลรายงานวัตถุดิบได้',
          success: false
        }
      }

      const result = await response.json()
      console.log('✅ API Success:', { hasData: !!result.data, dataKeys: result.data ? Object.keys(result.data) : [] })
      return {
        data: result.data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Material reports service error:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานวัตถุดิบ',
        success: false
      }
    }
  }

  // Get monthly trend data for materials
  async getMaterialMonthlyTrend(
    months: 3 | 6 | 12 = 3,
    branchId: string | null = null
  ): Promise<AdminReportsServiceResult<MonthlyTrendData[]>> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.set('months', months.toString())
      if (branchId) {
        queryParams.set('branchId', branchId)
      }

      const url = `/api/admin/reports/materials/trend?${queryParams.toString()}`

      console.log('🌐 Making materials trend API request:', { url, months, branchId })

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('🔍 Trend response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.log('❌ Trend API Error:', errorData)
        return {
          data: null,
          error: errorData.error || 'ไม่สามารถดึงข้อมูลแนวโน้มรายเดือนได้',
          success: false
        }
      }

      const result = await response.json()
      console.log('✅ Trend API Success:', { hasData: !!result.data, dataLength: result.data?.length })
      return {
        data: result.data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Material trend service error:', error)
      return {
        data: null,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแนวโน้มรายเดือน',
        success: false
      }
    }
  }

  // Generate quick date range presets
  getDateRangePresets(): Array<{ label: string; value: DateRangeFilter }> {
    const today = new Date()
    // const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return [
      {
        label: 'วันนี้',
        value: { type: 'today' }
      },
      {
        label: 'สัปดาห์นี้',
        value: { type: 'week' }
      },
      {
        label: 'เดือนนี้',
        value: { type: 'month' }
      },
      {
        label: 'กำหนดเอง',
        value: { 
          type: 'custom',
          startDate: monthStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }
      }
    ]
  }

  // Validate date range input
  validateDateRange(dateRange: DateRangeFilter): { valid: boolean; error?: string } {
    if (!dateRange.type) {
      return { valid: false, error: 'ประเภทช่วงเวลาไม่ถูกต้อง' }
    }

    if (dateRange.type === 'custom') {
      if (!dateRange.startDate || !dateRange.endDate) {
        return { valid: false, error: 'กรุณาระบุวันที่เริ่มต้นและสิ้นสุด' }
      }

      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { valid: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' }
      }

      if (startDate > endDate) {
        return { valid: false, error: 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด' }
      }

      // Check if date range is not too far in the past (1 year limit)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      
      if (startDate < oneYearAgo) {
        return { valid: false, error: 'ไม่สามารถดึงข้อมูลที่เก่ากว่า 1 ปีได้' }
      }
    }

    return { valid: true }
  }
}

// Export singleton instance
export const adminReportsService = new AdminReportsService()