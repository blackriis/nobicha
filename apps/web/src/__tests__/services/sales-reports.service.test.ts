import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SalesReportsService } from '@/lib/services/sales-reports.service'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('SalesReportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('submitReport', () => {
    it('should successfully submit sales report', async () => {
      const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
      const reportData = {
        totalSales: 1500.50,
        slipImage: mockFile
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          message: 'บันทึกรายงานยอดขายสำเร็จ',
          data: {
            id: 'report-1',
            total_sales: 1500.50,
            branches: { id: 'branch-1', name: 'สาขาทดสอบ' }
          }
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await SalesReportsService.submitReport(reportData)

      expect(result.success).toBe(true)
      expect(result.data?.total_sales).toBe(1500.50)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/employee/sales-reports',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
    })

    it('should validate sales amount before submission', async () => {
      const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
      const reportData = {
        totalSales: -100, // Invalid negative amount
        slipImage: mockFile
      }

      const result = await SalesReportsService.submitReport(reportData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('ยอดขายต้องเป็นตัวเลขบวกเท่านั้น')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate file type before submission', async () => {
      const mockFile = new File(['test'], 'document.pdf', { type: 'application/pdf' })
      const reportData = {
        totalSales: 1500.50,
        slipImage: mockFile
      }

      const result = await SalesReportsService.submitReport(reportData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate file size before submission', async () => {
      // Create a mock file that's too large (6MB)
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const reportData = {
        totalSales: 1500.50,
        slipImage: largeFile
      }

      const result = await SalesReportsService.submitReport(reportData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('ขนาดไฟล์เกิน 5MB')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle API error response', async () => {
      const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
      const reportData = {
        totalSales: 1500.50,
        slipImage: mockFile
      }

      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: 'คุณได้ทำการรายงานยอดขายของวันนี้แล้ว'
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await SalesReportsService.submitReport(reportData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('คุณได้ทำการรายงานยอดขายของวันนี้แล้ว')
    })

    it('should handle network error', async () => {
      const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
      const reportData = {
        totalSales: 1500.50,
        slipImage: mockFile
      }

      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await SalesReportsService.submitReport(reportData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    })
  })

  describe('getReports', () => {
    it('should successfully get reports without date filter', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: 'report-1',
              total_sales: 1500.50,
              report_date: '2025-01-17',
              branches: { id: 'branch-1', name: 'สาขาทดสอบ' }
            }
          ]
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await SalesReportsService.getReports()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/employee/sales-reports',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should get reports with date filter', async () => {
      const reportDate = '2025-01-17'
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: []
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await SalesReportsService.getReports(reportDate)

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/employee/sales-reports?report_date=${reportDate}`,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should handle API error when getting reports', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: 'Database error'
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await SalesReportsService.getReports()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })
  })

  describe('getTodaysReport', () => {
    it('should call getReports with today\'s date', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: []
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      // Mock today's date
      const today = '2025-01-17'
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-17T12:00:00.000Z')

      const result = await SalesReportsService.getTodaysReport()

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/employee/sales-reports?report_date=${today}`,
        expect.any(Object)
      )
    })
  })

  describe('validateSalesReportData', () => {
    it('should validate valid sales report data', () => {
      const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
      const data = {
        totalSales: 1500.50,
        slipImage: mockFile
      }

      const result = SalesReportsService.validateSalesReportData(data)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing total sales', () => {
      const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
      const data = {
        totalSales: NaN,
        slipImage: mockFile
      }

      const result = SalesReportsService.validateSalesReportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('กรุณากรอกยอดขาย')
    })

    it('should reject negative total sales', () => {
      const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
      const data = {
        totalSales: -100,
        slipImage: mockFile
      }

      const result = SalesReportsService.validateSalesReportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ยอดขายต้องเป็นตัวเลขบวกเท่านั้น')
    })

    it('should reject excessive total sales', () => {
      const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
      const data = {
        totalSales: 99999999999.99,
        slipImage: mockFile
      }

      const result = SalesReportsService.validateSalesReportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ยอดขายเกินจำนวนที่อนุญาต (ไม่เกิน 12 หลัก)')
    })

    it('should reject missing slip image', () => {
      const data = {
        totalSales: 1500.50,
        slipImage: null as any
      }

      const result = SalesReportsService.validateSalesReportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('กรุณาแนบรูปภาพสลิปยืนยันยอดขาย')
    })

    it('should reject invalid file type', () => {
      const mockFile = new File(['test'], 'document.pdf', { type: 'application/pdf' })
      const data = {
        totalSales: 1500.50,
        slipImage: mockFile
      }

      const result = SalesReportsService.validateSalesReportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('กรุณาเลือกไฟล์รูปภาพเท่านั้น (.jpg, .png, .webp)')
    })

    it('should reject file that is too large', () => {
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const data = {
        totalSales: 1500.50,
        slipImage: largeFile
      }

      const result = SalesReportsService.validateSalesReportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า')
    })
  })

  describe('utility methods', () => {
    it('should format currency correctly', () => {
      const result = SalesReportsService.formatCurrency(1500.50)
      expect(result).toBe('฿1,500.50')
    })

    it('should format report date correctly', () => {
      const result = SalesReportsService.formatReportDate('2025-01-17')
      expect(result).toContain('2568') // Should contain Buddhist year (2025 + 543)
      expect(result).toContain('มกราคม') // Should contain Thai month
    })
  })
})