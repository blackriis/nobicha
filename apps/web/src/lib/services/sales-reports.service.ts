import type { SalesReport } from '@employee-management/database'

export interface SalesReportData {
  totalSales: number
  slipImage: File
}

export interface SalesReportSubmission {
  success: boolean
  message?: string
  data?: SalesReport & {
    branches: {
      id: string
      name: string
    }
  }
  error?: string
}

export interface SalesReportListResponse {
  success: boolean
  data?: (SalesReport & {
    branches: {
      id: string
      name: string
      latitude: number
      longitude: number
    }
  })[]
  error?: string
}

/**
 * Sales Reports Service
 * Service layer for handling sales report API communications
 */
export class SalesReportsService {
  private static readonly API_BASE = '/api/employee/sales-reports'

  /**
   * Submit a new daily sales report
   */
  static async submitReport(reportData: SalesReportData): Promise<SalesReportSubmission> {
    try {
      // Validate inputs before submission
      const validation = this.validateSalesReportData(reportData)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        }
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('total_sales', reportData.totalSales.toString())
      formData.append('slip_image', reportData.slipImage)

      const response = await fetch(this.API_BASE, {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies for authentication
      })

      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        return {
          success: false,
          error: 'เกิดข้อผิดพลาดในการอ่านข้อมูลจากเซิร์ฟเวอร์'
        }
      }

      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          error: result?.error || 'No error message provided',
          url: response.url,
          fullResult: result
        }
        console.error('Sales report submission error:', JSON.stringify(errorDetails, null, 2))
        return {
          success: false,
          error: result?.error || 'เกิดข้อผิดพลาดในการส่งรายงาน'
        }
      }

      return {
        success: true,
        message: result.message,
        data: result.data
      }
    } catch (error) {
      console.error('Sales report submission error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }

  /**
   * Get employee's sales reports
   */
  static async getReports(reportDate?: string): Promise<SalesReportListResponse> {
    try {
      let url = this.API_BASE
      if (reportDate) {
        url += `?report_date=${encodeURIComponent(reportDate)}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies for authentication
      })

      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        return {
          success: false,
          error: 'เกิดข้อผิดพลาดในการอ่านข้อมูลจากเซิร์ฟเวอร์'
        }
      }

      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          error: result?.error || 'No error message provided',
          url: response.url,
          fullResult: result
        }
        console.error('Sales reports API error:', JSON.stringify(errorDetails, null, 2))
        return {
          success: false,
          error: result?.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน'
        }
      }

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      console.error('Sales reports fetch error:', error)
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
      }
    }
  }

  /**
   * Get today's sales report for the current employee
   */
  static async getTodaysReport(): Promise<SalesReportListResponse> {
    const today = new Date().toISOString().split('T')[0]
    return this.getReports(today)
  }

  /**
   * Validate sales report data before submission
   */
  static validateSalesReportData(data: SalesReportData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate total sales
    if (!data.totalSales || isNaN(data.totalSales)) {
      errors.push('กรุณากรอกยอดขาย')
    } else if (data.totalSales <= 0) {
      errors.push('ยอดขายต้องเป็นตัวเลขบวกเท่านั้น')
    } else if (data.totalSales > 9999999999.99) {
      errors.push('ยอดขายเกินจำนวนที่อนุญาต (ไม่เกิน 12 หลัก)')
    }

    // Validate slip image
    if (!data.slipImage) {
      errors.push('กรุณาแนบรูปภาพสลิปยืนยันยอดขาย')
    } else {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(data.slipImage.type)) {
        errors.push('กรุณาเลือกไฟล์รูปภาพเท่านั้น (.jpg, .png, .webp)')
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (data.slipImage.size > maxSize) {
        errors.push('ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return `฿${amount.toLocaleString('th-TH', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`
  }

  /**
   * Format date for display in Thai format
   */
  static formatReportDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}
