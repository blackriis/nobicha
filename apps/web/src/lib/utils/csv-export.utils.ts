// CSV Export Utilities for Admin Reports
// This is a placeholder implementation for future CSV export functionality

import type { EmployeeReport, BranchReport, SalesReport, MaterialReport } from '../services/admin-reports.service'

export interface CSVExportOptions {
  filename: string
  headers: string[]
  data: Record<string, unknown>[]
  dateRange?: {
    startDate: string
    endDate: string
  }
}

export interface CSVExportResult {
  success: boolean
  downloadUrl?: string
  error?: string
}

class CSVExportService {
  // Future implementation: Convert data to CSV format
  private formatDataToCSV(headers: string[], data: Record<string, unknown>[]): string {
    // CSV header row
    const csvHeaders = headers.join(',')
    
    // CSV data rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header] || ''
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    })
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  // Future implementation: Generate filename with timestamp
  private generateFilename(baseFilename: string, dateRange?: CSVExportOptions['dateRange']): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const rangeSuffix = dateRange ? `_${dateRange.startDate}_to_${dateRange.endDate}` : ''
    return `${baseFilename}${rangeSuffix}_${timestamp}.csv`
  }

  // Future implementation: Create downloadable blob
  private createDownloadBlob(csvContent: string): string {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    return URL.createObjectURL(blob)
  }

  // Placeholder: Export summary report to CSV
  async exportSummaryReport(options: CSVExportOptions): Promise<CSVExportResult> {
    try {
      // TODO: Implement actual CSV export functionality
      console.log('CSV Export Request:', options)
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Return placeholder result
      return {
        success: false,
        error: 'ฟีเจอร์ Export CSV จะพร้อมใช้งานในเวอร์ชันถัดไป'
      }
    } catch (error) {
      console.error('CSV export error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล'
      }
    }
  }

  // Placeholder: Export employee report to CSV
  async exportEmployeeReport(employees: EmployeeReport[], dateRange?: CSVExportOptions['dateRange']): Promise<CSVExportResult> {
    const options: CSVExportOptions = {
      filename: 'employee_report',
      headers: [
        'รหัสพนักงาน',
        'ชื่อ-นามสกุล', 
        'ชั่วโมงทำงานรวม',
        'จำนวนครั้งที่เข้างาน',
        'ชั่วโมงเฉลี่ยต่อครั้ง',
        'สาขาที่ทำงาน',
        'สถานะ'
      ],
      data: employees.map(emp => ({
        'รหัสพนักงาน': emp.employeeId,
        'ชื่อ-นามสกุล': emp.fullName,
        'ชั่วโมงทำงานรวม': emp.totalHours,
        'จำนวนครั้งที่เข้างาน': emp.totalSessions,
        'ชั่วโมงเฉลี่ยต่อครั้ง': emp.averageHoursPerSession,
        'สาขาที่ทำงาน': emp.branches.join(', '),
        'สถานะ': emp.status === 'working' ? 'กำลังทำงาน' : 'ออฟไลน์'
      })),
      dateRange
    }

    return this.exportSummaryReport(options)
  }

  // Placeholder: Export branch report to CSV
  async exportBranchReport(branches: BranchReport[], dateRange?: CSVExportOptions['dateRange']): Promise<CSVExportResult> {
    const options: CSVExportOptions = {
      filename: 'branch_report',
      headers: [
        'ชื่อสาขา',
        'ที่อยู่',
        'ยอดขายรวม',
        'พนักงานทั้งหมด',
        'พนักงานที่ทำงานวันนี้',
        'อัตราการเข้างาน (%)',
        'ชั่วโมงทำงานรวม',
        'ยอดขายต่อพนักงาน'
      ],
      data: branches.map(branch => ({
        'ชื่อสาขา': branch.branchName,
        'ที่อยู่': branch.address,
        'ยอดขายรวม': branch.sales.total,
        'พนักงานทั้งหมด': branch.employees.total,
        'พนักงานที่ทำงานวันนี้': branch.employees.activeToday,
        'อัตราการเข้างาน (%)': branch.employees.attendanceRate,
        'ชั่วโมงทำงานรวม': branch.workHours.total,
        'ยอดขายต่อพนักงาน': branch.performance.salesPerEmployee
      })),
      dateRange
    }

    return this.exportSummaryReport(options)
  }

  // Placeholder: Export sales report to CSV
  async exportSalesReport(salesData: SalesReport, dateRange?: CSVExportOptions['dateRange']): Promise<CSVExportResult> {
    const options: CSVExportOptions = {
      filename: 'sales_report',
      headers: [
        'วันที่',
        'สาขา',
        'พนักงาน',
        'รหัสพนักงาน',
        'ยอดขาย',
        'วันที่รายงาน'
      ],
      data: salesData.recentReports.map((report) => ({
        'วันที่': new Date(report.createdAt).toLocaleDateString('th-TH'),
        'สาขา': report.branchName,
        'พนักงาน': report.employeeName,
        'รหัสพนักงาน': report.employeeId,
        'ยอดขาย': report.totalSales,
        'วันที่รายงาน': report.reportDate
      })),
      dateRange
    }

    return this.exportSummaryReport(options)
  }

  // Placeholder: Export material usage report to CSV
  async exportMaterialReport(materialData: MaterialReport, dateRange?: CSVExportOptions['dateRange']): Promise<CSVExportResult> {
    const options: CSVExportOptions = {
      filename: 'material_usage_report',
      headers: [
        'วัตถุดิบ',
        'หน่วย',
        'จำนวนที่ใช้รวม',
        'ต้นทุนรวม',
        'จำนวนครั้งที่ใช้',
        'ต้นทุนเฉลี่ยต่อครั้ง',
        'สาขาที่ใช้',
        'ผู้ส่งออก'
      ],
      data: materialData.materialBreakdown.map((material) => ({
        'วัตถุดิบ': material.materialName,
        'หน่วย': material.unit,
        'จำนวนที่ใช้รวม': material.totalQuantity,
        'ต้นทุนรวม': material.totalCost,
        'จำนวนครั้งที่ใช้': material.usageCount,
        'ต้นทุนเฉลี่ยต่อครั้ง': material.averageCostPerUsage,
        'สาขาที่ใช้': material.branches.join(', '),
        'ผู้ส่งออก': material.supplier || 'ไม่ระบุ'
      })),
      dateRange
    }

    return this.exportSummaryReport(options)
  }

  // Show placeholder notification
  showExportNotification(type: 'summary' | 'employee' | 'branch' | 'sales' | 'material'): void {
    const messages = {
      summary: 'ฟีเจอร์ส่งออกสรุปรายงานจะพร้อมใช้งานในเวอร์ชันถัดไป',
      employee: 'ฟีเจอร์ส่งออกรายงานพนักงานจะพร้อมใช้งานในเวอร์ชันถัดไป',
      branch: 'ฟีเจอร์ส่งออกรายงานสาขาจะพร้อมใช้งานในเวอร์ชันถัดไป',
      sales: 'ฟีเจอร์ส่งออกรายงานการขายจะพร้อมใช้งานในเวอร์ชันถัดไป',
      material: 'ฟีเจอร์ส่งออกรายงานวัตถุดิบจะพร้อมใช้งานในเวอร์ชันถัดไป'
    }

    if (typeof window !== 'undefined') {
      alert(messages[type])
    }
  }
}

// Export singleton instance
export const csvExportService = new CSVExportService()

// Utility functions for future use
export const formatThaiCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatThaiDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatWorkingHours = (hours: number): string => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h} ชั่วโมง ${m} นาที`
}