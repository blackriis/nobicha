import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PUT as bonusPUT, DELETE as bonusDELETE } from '@/app/api/admin/payroll-details/[id]/bonus/route'
import { PUT as deductionPUT, DELETE as deductionDELETE } from '@/app/api/admin/payroll-details/[id]/deduction/route'
import { NextRequest } from 'next/server'

// Types for payroll bonus/deduction requests
interface BonusUpdateRequest {
  bonus: number
  bonus_reason?: string
}

interface DeductionUpdateRequest {
  deduction: number
  deduction_reason?: string
}

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock audit service
const mockAuditService = {
  createAuditLog: vi.fn()
}

vi.mock('@/lib/services/audit.service', () => ({
  auditService: mockAuditService
}))

// Helper function to create mock request
const createMockRequest = (body: BonusUpdateRequest | DeductionUpdateRequest): NextRequest => {
  return new NextRequest('https://example.com/test', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('Payroll Details Bonus API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PUT /api/admin/payroll-details/[id]/bonus', () => {
    const mockPayrollDetail = {
      id: 'test-id',
      payroll_cycle_id: 'cycle-1',
      user_id: 'user-1',
      base_pay: 30000,
      overtime_pay: 0,
      bonus: 0,
      bonus_reason: null,
      deduction: 500,
      deduction_reason: 'มาสาย',
      net_pay: 29500,
      payroll_cycles: { status: 'active' }
    }

    it('should successfully update bonus', async () => {
      // Mock Supabase responses
      mockSupabase.single.mockResolvedValueOnce({
        data: mockPayrollDetail,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ...mockPayrollDetail,
          bonus: 2000,
          bonus_reason: 'ผลงานดีเด่น',
          net_pay: 31500
        },
        error: null
      })

      // Mock audit service
      mockAuditService.createAuditLog.mockResolvedValueOnce({ success: true })

      const request = createMockRequest({
        bonus: 2000,
        bonus_reason: 'ผลงานดีเด่น'
      })

      const response = await bonusPUT(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('อัปเดตโบนัสเรียบร้อยแล้ว')
      expect(responseData.data.bonus).toBe(2000)
      expect(responseData.data.bonus_reason).toBe('ผลงานดีเด่น')
      expect(responseData.data.net_pay).toBe(31500)

      // Verify audit log was created
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith({
        user_id: 'user-1',
        action: 'UPDATE',
        table_name: 'payroll_details',
        record_id: 'test-id',
        old_values: {
          bonus: 0,
          bonus_reason: null,
          net_pay: 29500
        },
        new_values: {
          bonus: 2000,
          bonus_reason: 'ผลงานดีเด่น',
          net_pay: 31500
        },
        description: 'Updated bonus: 2000 บาท (ผลงานดีเด่น)'
      })
    })

    it('should reject negative bonus amount', async () => {
      const request = createMockRequest({
        bonus: -1000,
        bonus_reason: 'invalid'
      })

      const response = await bonusPUT(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('จำนวนโบนัสต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0')
    })

    it('should require bonus reason when bonus > 0', async () => {
      const request = createMockRequest({
        bonus: 1000
      })

      const response = await bonusPUT(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('กรุณาระบุเหตุผลในการให้โบนัส')
    })

    it('should prevent modification of completed cycles', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ...mockPayrollDetail,
          payroll_cycles: { status: 'completed' }
        },
        error: null
      })

      const request = createMockRequest({
        bonus: 1000,
        bonus_reason: 'test'
      })

      const response = await bonusPUT(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toContain('ไม่สามารถแก้ไขโบนัสในรอบที่ปิดแล้ว')
    })

    it('should prevent negative net pay', async () => {
      const lowPayDetail = {
        ...mockPayrollDetail,
        base_pay: 1000,
        deduction: 2000,
        net_pay: -1000
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: lowPayDetail,
        error: null
      })

      const request = createMockRequest({
        bonus: 500,
        bonus_reason: 'test bonus'
      })

      const response = await bonusPUT(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('เงินเดือนสุทธิไม่สามารถติดลบได้')
    })

    it('should handle payroll detail not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      const request = createMockRequest({
        bonus: 1000,
        bonus_reason: 'test'
      })

      const response = await bonusPUT(request, { params: { id: 'invalid-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('ไม่พบข้อมูลรายละเอียดเงินเดือน')
    })
  })

  describe('DELETE /api/admin/payroll-details/[id]/bonus', () => {
    const mockPayrollDetailWithBonus = {
      id: 'test-id',
      user_id: 'user-1',
      base_pay: 30000,
      overtime_pay: 0,
      bonus: 3000,
      bonus_reason: 'ผลงานดี',
      deduction: 500,
      net_pay: 32500,
      payroll_cycles: { status: 'active' }
    }

    it('should successfully delete bonus', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockPayrollDetailWithBonus,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ...mockPayrollDetailWithBonus,
          bonus: 0,
          bonus_reason: null,
          net_pay: 29500
        },
        error: null
      })

      mockAuditService.createAuditLog.mockResolvedValueOnce({ success: true })

      const request = new NextRequest('https://example.com/test', { method: 'DELETE' })
      const response = await bonusDELETE(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('ลบโบนัสเรียบร้อยแล้ว')
      expect(responseData.data.bonus).toBe(0)
      expect(responseData.data.bonus_reason).toBeNull()

      // Verify audit log
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith({
        user_id: 'user-1',
        action: 'DELETE',
        table_name: 'payroll_details',
        record_id: 'test-id',
        old_values: {
          bonus: 3000,
          bonus_reason: 'ผลงานดี',
          net_pay: 32500
        },
        new_values: {
          bonus: 0,
          bonus_reason: null,
          net_pay: 29500
        },
        description: 'Deleted bonus: 3000 บาท (ผลงานดี)'
      })
    })

    it('should prevent deletion from completed cycles', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ...mockPayrollDetailWithBonus,
          payroll_cycles: { status: 'completed' }
        },
        error: null
      })

      const request = new NextRequest('https://example.com/test', { method: 'DELETE' })
      const response = await bonusDELETE(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toContain('ไม่สามารถลบโบนัสในรอบที่ปิดแล้ว')
    })
  })
})

describe('Payroll Details Deduction API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PUT /api/admin/payroll-details/[id]/deduction', () => {
    const mockPayrollDetail = {
      id: 'test-id',
      user_id: 'user-1',
      base_pay: 30000,
      overtime_pay: 0,
      bonus: 2000,
      bonus_reason: 'ผลงานดี',
      deduction: 0,
      deduction_reason: null,
      net_pay: 32000,
      payroll_cycles: { status: 'active' }
    }

    it('should successfully update deduction', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockPayrollDetail,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ...mockPayrollDetail,
          deduction: 1000,
          deduction_reason: 'มาสาย 5 วัน',
          net_pay: 31000
        },
        error: null
      })

      mockAuditService.createAuditLog.mockResolvedValueOnce({ success: true })

      const request = createMockRequest({
        deduction: 1000,
        deduction_reason: 'มาสาย 5 วัน'
      })

      const response = await deductionPUT(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('อัปเดตการหักเงินเรียบร้อยแล้ว')
      expect(responseData.data.deduction).toBe(1000)
      expect(responseData.data.deduction_reason).toBe('มาสาย 5 วัน')
      expect(responseData.data.net_pay).toBe(31000)
    })

    it('should reject negative deduction amount', async () => {
      const request = createMockRequest({
        deduction: -500,
        deduction_reason: 'invalid'
      })

      const response = await deductionPUT(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('จำนวนหักเงินต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0')
    })

    it('should require deduction reason when deduction > 0', async () => {
      const request = createMockRequest({
        deduction: 500
      })

      const response = await deductionPUT(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('กรุณาระบุเหตุผลในการหักเงิน')
    })

    it('should prevent excessive deduction causing negative net pay', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockPayrollDetail,
        error: null
      })

      const request = createMockRequest({
        deduction: 35000, // Exceeds base_pay + bonus
        deduction_reason: 'excessive deduction'
      })

      const response = await deductionPUT(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('เงินเดือนสุทธิไม่สามารถติดลบได้')
    })
  })

  describe('DELETE /api/admin/payroll-details/[id]/deduction', () => {
    const mockPayrollDetailWithDeduction = {
      id: 'test-id',
      user_id: 'user-1',
      base_pay: 30000,
      bonus: 2000,
      deduction: 1500,
      deduction_reason: 'มาสาย',
      net_pay: 30500,
      payroll_cycles: { status: 'active' }
    }

    it('should successfully delete deduction', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockPayrollDetailWithDeduction,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ...mockPayrollDetailWithDeduction,
          deduction: 0,
          deduction_reason: null,
          net_pay: 32000
        },
        error: null
      })

      mockAuditService.createAuditLog.mockResolvedValueOnce({ success: true })

      const request = new NextRequest('https://example.com/test', { method: 'DELETE' })
      const response = await deductionDELETE(request, { params: { id: 'test-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('ลบการหักเงินเรียบร้อยแล้ว')
      expect(responseData.data.deduction).toBe(0)
      expect(responseData.data.deduction_reason).toBeNull()
      expect(responseData.data.net_pay).toBe(32000)
    })
  })
})