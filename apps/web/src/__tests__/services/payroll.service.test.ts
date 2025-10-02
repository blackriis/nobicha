import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock Supabase client with vi.hoisted to fix initialization order
const { mockSupabaseAuth } = vi.hoisted(() => ({
  mockSupabaseAuth: {
    getSession: vi.fn()
  }
}))

// Mock the createClient function
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: mockSupabaseAuth
  })
}))

import { PayrollService } from '@/features/payroll/services/payroll.service'

describe('PayrollService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default auth mock setup - success case
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-access-token',
          user: {
            email: 'test@example.com'
          }
        }
      },
      error: null
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getPayrollCycles', () => {
    it('should successfully fetch payroll cycles', async () => {
      const mockResponse = {
        payroll_cycles: [
          {
            id: '1',
            name: 'เงินเดือนมกราคม 2568',
            start_date: '2025-01-01',
            end_date: '2025-01-31',
            status: 'active' as const,
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.getPayrollCycles()

      expect(result.success).toBe(true)
      expect(result.data.payroll_cycles).toHaveLength(1)
      expect(result.data.payroll_cycles[0].name).toBe('เงินเดือนมกราคม 2568')
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/payroll-cycles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-access-token',
        },
      })
    })

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'ไม่ได้รับอนุญาต' })
      })

      const result = await PayrollService.getPayrollCycles()

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่ได้รับอนุญาต')
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await PayrollService.getPayrollCycles()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('createPayrollCycle', () => {
    const validCycleData = {
      name: 'เงินเดือนกุมภาพันธ์ 2568',
      start_date: '2025-02-01',
      end_date: '2025-02-28'
    }

    it('should successfully create payroll cycle', async () => {
      const mockResponse = {
        message: 'สร้างรอบการจ่ายเงินเดือนเรียบร้อยแล้ว',
        payroll_cycle: {
          id: '2',
          ...validCycleData,
          status: 'active' as const,
          created_at: '2025-02-01T00:00:00Z'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.createPayrollCycle(validCycleData)

      expect(result.success).toBe(true)
      expect(result.data.payroll_cycle.name).toBe(validCycleData.name)
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/payroll-cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-access-token',
        },
        body: JSON.stringify(validCycleData)
      })
    })

    it('should validate empty name', async () => {
      const invalidData = { ...validCycleData, name: '' }
      const result = await PayrollService.createPayrollCycle(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('กรุณากรอกชื่อรอบการจ่ายเงินเดือน')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate missing start date', async () => {
      const invalidData = { ...validCycleData, start_date: '' }
      const result = await PayrollService.createPayrollCycle(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('กรุณาเลือกวันที่เริ่มต้น')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate missing end date', async () => {
      const invalidData = { ...validCycleData, end_date: '' }
      const result = await PayrollService.createPayrollCycle(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('กรุณาเลือกวันที่สิ้นสุด')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate date range (start >= end)', async () => {
      const invalidData = { 
        ...validCycleData, 
        start_date: '2025-02-28', 
        end_date: '2025-02-01' 
      }
      const result = await PayrollService.createPayrollCycle(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate future date limits', async () => {
      const futureYear = new Date().getFullYear() + 2
      const invalidData = { 
        ...validCycleData, 
        start_date: `${futureYear}-01-01`, 
        end_date: `${futureYear}-12-31` 
      }
      const result = await PayrollService.createPayrollCycle(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('วันที่สิ้นสุดไม่ควรเกินปีถัดไปจากปัจจุบัน')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle overlapping cycle error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          error: 'ช่วงวันที่ทับซ้อนกับรอบการจ่ายเงินเดือนที่มีอยู่แล้ว',
          conflicting_cycles: [{ name: 'รอบเก่า' }]
        })
      })

      const result = await PayrollService.createPayrollCycle(validCycleData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ช่วงวันที่ทับซ้อนกับรอบการจ่ายเงินเดือนที่มีอยู่แล้ว')
    })
  })

  describe('calculatePayroll', () => {
    const cycleId = 'test-cycle-id'

    it('should successfully calculate payroll', async () => {
      const mockResponse = {
        message: 'คำนวณเงินเดือนเรียบร้อยแล้ว',
        payroll_cycle: {
          id: cycleId,
          name: 'เงินเดือนมกราคม 2568',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          status: 'active' as const,
          created_at: '2025-01-01T00:00:00Z'
        },
        calculation_summary: {
          total_employees: 2,
          total_base_pay: 15000,
          calculation_period: {
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          }
        },
        employee_calculations: [
          {
            employee_id: 'emp1',
            full_name: 'พนักงาน ทดสอบ',
            total_hours: 160,
            total_days_worked: 20,
            base_pay: 8000,
            calculation_method: 'hourly' as const
          },
          {
            employee_id: 'emp2',
            full_name: 'พนักงาน สอง',
            total_hours: 140,
            total_days_worked: 18,
            base_pay: 7000,
            calculation_method: 'mixed' as const
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(true)
      expect(result.data.calculation_summary.total_employees).toBe(2)
      expect(result.data.calculation_summary.total_base_pay).toBe(15000)
      expect(result.data.employee_calculations).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledWith(`/api/admin/payroll-cycles/${cycleId}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-access-token',
        },
      })
    })

    it('should validate empty cycle ID', async () => {
      const result = await PayrollService.calculatePayroll('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('กรุณาระบุ ID ของรอบการจ่ายเงินเดือน')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle calculation already exists error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          error: 'การคำนวณเงินเดือนสำหรับรอบนี้ได้ทำไปแล้ว'
        })
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('การคำนวณเงินเดือนสำหรับรอบนี้ได้ทำไปแล้ว')
    })

    it('should handle no employees found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          error: 'ไม่พบพนักงานที่มีข้อมูลค่าแรงสำหรับการคำนวณ'
        })
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่พบพนักงานที่มีข้อมูลค่าแรงสำหรับการคำนวณ')
    })

    it('should handle authentication failure', async () => {
      // Mock auth failure
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: new Error('Authentication failed')
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('การยืนยันตัวตนล้มเหลว กรุณาเข้าสู่ระบบใหม่')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle non-JSON error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        url: '/api/admin/payroll-cycles/test-cycle-id/calculate',
        text: async () => 'Server Error: Database connection failed',
        json: async () => { throw new Error('Not valid JSON') },
        headers: new Map([['content-type', 'text/plain']])
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง')
    })

    it('should handle network timeout error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network timeout')
    })

    it('should validate whitespace-only cycle ID', async () => {
      const result = await PayrollService.calculatePayroll('   ')

      expect(result.success).toBe(false)
      expect(result.error).toBe('กรุณาระบุ ID ของรอบการจ่ายเงินเดือน')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle unauthorized access (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ 
          error: 'ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้'
        })
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้')
    })

    it('should handle invalid cycle ID format', async () => {
      const invalidCycleId = 'invalid-cycle-id-123'
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          error: 'ไม่พบรอบการจ่ายเงินเดือนที่ระบุ'
        })
      })

      const result = await PayrollService.calculatePayroll(invalidCycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่พบรอบการจ่ายเงินเดือนที่ระบุ')
    })

    it('should handle calculation with zero employees', async () => {
      const mockResponse = {
        message: 'คำนวณเงินเดือนเรียบร้อยแล้ว',
        payroll_cycle: {
          id: cycleId,
          name: 'เงินเดือนมกราคม 2568',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          status: 'active' as const,
          created_at: '2025-01-01T00:00:00Z'
        },
        calculation_summary: {
          total_employees: 0,
          total_base_pay: 0,
          calculation_period: {
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          }
        },
        employee_calculations: []
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(true)
      expect(result.data.calculation_summary.total_employees).toBe(0)
      expect(result.data.employee_calculations).toHaveLength(0)
    })

    it('should handle calculation with large number of employees', async () => {
      const largeEmployeeList = Array.from({ length: 500 }, (_, i) => ({
        employee_id: `emp${i + 1}`,
        full_name: `พนักงาน ${i + 1}`,
        total_hours: 160,
        total_days_worked: 20,
        base_pay: 15000 + (i * 100), // Varying salaries
        calculation_method: i % 3 === 0 ? 'hourly' : i % 3 === 1 ? 'daily' : 'mixed' as const
      }))

      const mockResponse = {
        message: 'คำนวณเงินเดือนเรียบร้อยแล้ว',
        payroll_cycle: {
          id: cycleId,
          name: 'เงินเดือนมกราคม 2568',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          status: 'active' as const,
          created_at: '2025-01-01T00:00:00Z'
        },
        calculation_summary: {
          total_employees: 500,
          total_base_pay: 19950000, // Sum of all salaries
          calculation_period: {
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          }
        },
        employee_calculations: largeEmployeeList
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(true)
      expect(result.data.calculation_summary.total_employees).toBe(500)
      expect(result.data.employee_calculations).toHaveLength(500)
      expect(result.data.calculation_summary.total_base_pay).toBe(19950000)
    })

    it('should handle missing session token', async () => {
      // Mock missing session
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่พบข้อมูลการยืนยันตัวตน กรุณาเข้าสู่ระบบ')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle 403 forbidden error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => { throw new Error('Not JSON') }
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้')
    })

    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => { throw new Error('Not JSON') }
      })

      const result = await PayrollService.calculatePayroll(cycleId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้ กรุณาเข้าสู่ระบบใหม่')
    })
  })

  describe('utility methods', () => {
    describe('isValidDate', () => {
      it('should validate correct date format', () => {
        expect(PayrollService.isValidDate('2025-01-01')).toBe(true)
        expect(PayrollService.isValidDate('2025-12-31')).toBe(true)
      })

      it('should reject invalid date format', () => {
        expect(PayrollService.isValidDate('invalid-date')).toBe(false)
        expect(PayrollService.isValidDate('2025-13-01')).toBe(false)
        expect(PayrollService.isValidDate('2025-02-30')).toBe(false)
      })
    })

    describe('formatDateThai', () => {
      it('should format date in Thai locale', () => {
        const result = PayrollService.formatDateThai('2025-01-01')
        expect(result).toContain('2568') // Buddhist year
        expect(result).toContain('มกราคม')
      })

      it('should handle invalid date gracefully', () => {
        const invalidDate = 'invalid-date'
        const result = PayrollService.formatDateThai(invalidDate)
        expect(result).toBe(invalidDate)
      })
    })

    describe('calculatePeriodDays', () => {
      it('should calculate correct number of days', () => {
        expect(PayrollService.calculatePeriodDays('2025-01-01', '2025-01-31')).toBe(31)
        expect(PayrollService.calculatePeriodDays('2025-02-01', '2025-02-28')).toBe(28)
      })

      it('should handle invalid dates', () => {
        expect(PayrollService.calculatePeriodDays('invalid', '2025-01-31')).toBe(0)
      })
    })

    describe('formatCurrency', () => {
      it('should format currency in Thai baht', () => {
        const result = PayrollService.formatCurrency(1234.56)
        expect(result).toContain('฿')
        expect(result).toContain('1,234.56')
      })

      it('should handle zero amount', () => {
        const result = PayrollService.formatCurrency(0)
        expect(result).toBe('฿0.00')
      })

      it('should handle negative amount', () => {
        const result = PayrollService.formatCurrency(-500)
        expect(result).toBe('-฿500.00')
      })
    })

    describe('generateCalculationSummary', () => {
      const mockCalculations = [
        {
          employee_id: 'emp1',
          full_name: 'Employee 1',
          total_hours: 160,
          total_days_worked: 20,
          base_pay: 8000,
          calculation_method: 'hourly' as const
        },
        {
          employee_id: 'emp2',
          full_name: 'Employee 2',
          total_hours: 140,
          total_days_worked: 18,
          base_pay: 7000,
          calculation_method: 'daily' as const
        },
        {
          employee_id: 'emp3',
          full_name: 'Employee 3',
          total_hours: 180,
          total_days_worked: 22,
          base_pay: 9000,
          calculation_method: 'mixed' as const
        }
      ]

      it('should generate correct calculation summary', () => {
        const summary = PayrollService.generateCalculationSummary(mockCalculations)

        expect(summary.totalEmployees).toBe(3)
        expect(summary.totalBasePay).toBe(24000)
        expect(summary.averageBasePay).toBe(8000)
        expect(summary.totalHours).toBe(480)
        expect(summary.averageHours).toBe(160)
        expect(summary.methodBreakdown.hourly).toBe(1)
        expect(summary.methodBreakdown.daily).toBe(1)
        expect(summary.methodBreakdown.mixed).toBe(1)
      })

      it('should handle empty calculations array', () => {
        const summary = PayrollService.generateCalculationSummary([])

        expect(summary.totalEmployees).toBe(0)
        expect(summary.totalBasePay).toBe(0)
        expect(summary.averageBasePay).toBe(0)
        expect(summary.totalHours).toBe(0)
        expect(summary.averageHours).toBe(0)
        expect(summary.methodBreakdown.hourly).toBe(0)
        expect(summary.methodBreakdown.daily).toBe(0)
        expect(summary.methodBreakdown.mixed).toBe(0)
      })
    })
  })
})