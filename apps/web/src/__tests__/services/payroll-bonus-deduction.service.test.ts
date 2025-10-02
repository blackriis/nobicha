import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PayrollService } from '@/features/payroll/services/payroll.service'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('PayrollService - Bonus/Deduction Management', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('updateBonus', () => {
    it('should successfully update bonus with valid data', async () => {
      const mockResponse = {
        message: 'อัปเดตโบนัสเรียบร้อยแล้ว',
        data: {
          id: 'test-id',
          bonus: 5000,
          bonus_reason: 'ผลงานดีเด่น',
          net_pay: 35000
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.updateBonus('test-id', 5000, 'ผลงานดีเด่น')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/payroll-details/test-id/bonus',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bonus: 5000, bonus_reason: 'ผลงานดีเด่น' })
        }
      )
    })

    it('should validate bonus amount is not negative', async () => {
      const result = await PayrollService.updateBonus('test-id', -1000, 'invalid bonus')

      expect(result.success).toBe(false)
      expect(result.error).toContain('จำนวนโบนัสต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should require bonus reason when bonus > 0', async () => {
      const result = await PayrollService.updateBonus('test-id', 1000)

      expect(result.success).toBe(false)
      expect(result.error).toContain('กรุณาระบุเหตุผลในการให้โบนัส')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should allow zero bonus without reason', async () => {
      const mockResponse = {
        message: 'อัปเดตโบนัสเรียบร้อยแล้ว',
        data: { id: 'test-id', bonus: 0, bonus_reason: null, net_pay: 30000 }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.updateBonus('test-id', 0)

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/payroll-details/test-id/bonus',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bonus: 0, bonus_reason: undefined })
        }
      )
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'ไม่พบข้อมูลรายละเอียดเงินเดือน' })
      })

      const result = await PayrollService.updateBonus('invalid-id', 1000, 'test reason')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่พบข้อมูลรายละเอียดเงินเดือน')
    })
  })

  describe('deleteBonus', () => {
    it('should successfully delete bonus', async () => {
      const mockResponse = {
        message: 'ลบโบนัสเรียบร้อยแล้ว',
        data: {
          id: 'test-id',
          bonus: 0,
          bonus_reason: null,
          net_pay: 30000
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.deleteBonus('test-id')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/payroll-details/test-id/bonus',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      )
    })

    it('should validate payroll detail ID', async () => {
      const result = await PayrollService.deleteBonus('')

      expect(result.success).toBe(false)
      expect(result.error).toContain('กรุณาระบุ ID ของรายละเอียดเงินเดือน')
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('updateDeduction', () => {
    it('should successfully update deduction with valid data', async () => {
      const mockResponse = {
        message: 'อัปเดตการหักเงินเรียบร้อยแล้ว',
        data: {
          id: 'test-id',
          deduction: 2000,
          deduction_reason: 'มาสาย',
          net_pay: 28000
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.updateDeduction('test-id', 2000, 'มาสาย')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/payroll-details/test-id/deduction',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deduction: 2000, deduction_reason: 'มาสาย' })
        }
      )
    })

    it('should validate deduction amount is not negative', async () => {
      const result = await PayrollService.updateDeduction('test-id', -500, 'invalid deduction')

      expect(result.success).toBe(false)
      expect(result.error).toContain('จำนวนหักเงินต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should require deduction reason when deduction > 0', async () => {
      const result = await PayrollService.updateDeduction('test-id', 500)

      expect(result.success).toBe(false)
      expect(result.error).toContain('กรุณาระบุเหตุผลในการหักเงิน')
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('deleteDeduction', () => {
    it('should successfully delete deduction', async () => {
      const mockResponse = {
        message: 'ลบการหักเงินเรียบร้อยแล้ว',
        data: {
          id: 'test-id',
          deduction: 0,
          deduction_reason: null,
          net_pay: 30000
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await PayrollService.deleteDeduction('test-id')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/payroll-details/test-id/deduction',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      )
    })
  })

  describe('validateBonusDeductionData', () => {
    it('should validate bonus data correctly', () => {
      const validData = { bonus: 1000, bonus_reason: 'ผลงานดีเด่น' }
      const result = PayrollService.validateBonusDeductionData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject negative bonus', () => {
      const invalidData = { bonus: -500, bonus_reason: 'invalid' }
      const result = PayrollService.validateBonusDeductionData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('จำนวนโบนัสต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0')
    })

    it('should reject bonus > 0 without reason', () => {
      const invalidData = { bonus: 1000 }
      const result = PayrollService.validateBonusDeductionData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('กรุณาระบุเหตุผลในการให้โบนัส')
    })

    it('should reject bonus > 0 with empty reason', () => {
      const invalidData = { bonus: 1000, bonus_reason: '   ' }
      const result = PayrollService.validateBonusDeductionData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('กรุณาระบุเหตุผลในการให้โบนัส')
    })

    it('should reject reason that is too long', () => {
      const longReason = 'a'.repeat(501)
      const invalidData = { bonus: 1000, bonus_reason: longReason }
      const result = PayrollService.validateBonusDeductionData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('เหตุผลโบนัสต้องไม่เกิน 500 ตัวอักษร')
    })

    it('should validate deduction data correctly', () => {
      const validData = { deduction: 500, deduction_reason: 'มาสาย' }
      const result = PayrollService.validateBonusDeductionData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate both bonus and deduction together', () => {
      const validData = {
        bonus: 1000,
        bonus_reason: 'ผลงานดี',
        deduction: 200,
        deduction_reason: 'มาสาย 1 วัน'
      }
      const result = PayrollService.validateBonusDeductionData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('createAdjustmentPreview', () => {
    const mockEmployee = {
      id: 'emp-1',
      user_id: 'user-1',
      full_name: 'สมชาย ใจดี',
      base_pay: 30000,
      bonus: 1000,
      bonus_reason: 'เดิม',
      deduction: 500,
      deduction_reason: 'เดิม',
      net_pay: 30500
    }

    it('should create preview for bonus adjustment', () => {
      const adjustments = { bonus: 2000, bonus_reason: 'ผลงานดีเด่น' }
      const preview = PayrollService.createAdjustmentPreview(mockEmployee, adjustments)

      expect(preview.employee_id).toBe('user-1')
      expect(preview.full_name).toBe('สมชาย ใจดี')
      expect(preview.current_bonus).toBe(1000)
      expect(preview.new_bonus).toBe(2000)
      expect(preview.new_net_pay).toBe(31500) // 30000 + 2000 - 500
      expect(preview.adjustment_type).toBe('bonus')
      expect(preview.adjustment_reason).toBe('ผลงานดีเด่น')
    })

    it('should create preview for deduction adjustment', () => {
      const adjustments = { deduction: 1000, deduction_reason: 'มาสาย 5 วัน' }
      const preview = PayrollService.createAdjustmentPreview(mockEmployee, adjustments)

      expect(preview.current_deduction).toBe(500)
      expect(preview.new_deduction).toBe(1000)
      expect(preview.new_net_pay).toBe(30000) // 30000 + 1000 - 1000
      expect(preview.adjustment_type).toBe('deduction')
      expect(preview.adjustment_reason).toBe('มาสาย 5 วัน')
    })

    it('should create preview for both adjustments', () => {
      const adjustments = {
        bonus: 1500,
        bonus_reason: 'ผลงานดี',
        deduction: 300,
        deduction_reason: 'มาสาย'
      }
      const preview = PayrollService.createAdjustmentPreview(mockEmployee, adjustments)

      expect(preview.new_bonus).toBe(1500)
      expect(preview.new_deduction).toBe(300)
      expect(preview.new_net_pay).toBe(31200) // 30000 + 1500 - 300
      expect(preview.adjustment_type).toBe('both')
      expect(preview.adjustment_reason).toBe('โบนัส: ผลงานดี, หักเงิน: มาสาย')
    })
  })
})