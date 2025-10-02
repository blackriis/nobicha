import { describe, it, expect } from 'vitest'
import { PayrollDetailUtils } from '@/features/payroll/utils/payroll-detail.utils'

describe('PayrollDetailUtils', () => {
  describe('calculateNetPay', () => {
    it('should calculate net pay correctly with all components', () => {
      const result = PayrollDetailUtils.calculateNetPay(30000, 5000, 2000, 1500)
      
      expect(result.base_pay).toBe(30000)
      expect(result.overtime_pay).toBe(5000)
      expect(result.bonus).toBe(2000)
      expect(result.deduction).toBe(1500)
      expect(result.net_pay).toBe(35500) // 30000 + 5000 + 2000 - 1500
      expect(result.calculation_breakdown).toHaveLength(5)
      expect(result.calculation_breakdown[0]).toContain('เงินเดือนพื้นฐาน: ฿30,000.00')
      expect(result.calculation_breakdown[4]).toContain('= เงินเดือนสุทธิ: ฿35,500.00')
    })

    it('should calculate with default values', () => {
      const result = PayrollDetailUtils.calculateNetPay(25000)
      
      expect(result.net_pay).toBe(25000)
      expect(result.overtime_pay).toBe(0)
      expect(result.bonus).toBe(0)
      expect(result.deduction).toBe(0)
      expect(result.calculation_breakdown).toHaveLength(2) // base pay + net pay
    })

    it('should handle negative net pay', () => {
      const result = PayrollDetailUtils.calculateNetPay(10000, 0, 0, 15000)
      
      expect(result.net_pay).toBe(-5000)
      expect(result.calculation_breakdown[3]).toContain('= เงินเดือนสุทธิ: -฿5,000.00')
    })
  })

  describe('isNetPayNegative', () => {
    it('should return false for positive net pay', () => {
      expect(PayrollDetailUtils.isNetPayNegative(30000, 0, 5000, 2000)).toBe(false)
    })

    it('should return true for negative net pay', () => {
      expect(PayrollDetailUtils.isNetPayNegative(10000, 0, 0, 15000)).toBe(true)
    })

    it('should return false for zero net pay', () => {
      expect(PayrollDetailUtils.isNetPayNegative(10000, 0, 0, 10000)).toBe(false)
    })
  })

  describe('createPayrollDetailsSummary', () => {
    const mockDetails = [
      {
        id: '1',
        payroll_cycle_id: 'cycle-1',
        user_id: 'user-1',
        base_pay: 30000,
        overtime_hours: 0,
        overtime_rate: 0,
        overtime_pay: 0,
        bonus: 2000,
        bonus_reason: 'ผลงานดี',
        deduction: 500,
        deduction_reason: 'มาสาย',
        net_pay: 31500,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        payroll_cycle_id: 'cycle-1',
        user_id: 'user-2',
        base_pay: 25000,
        overtime_hours: 0,
        overtime_rate: 0,
        overtime_pay: 0,
        bonus: 0,
        deduction: 1000,
        deduction_reason: 'ลา',
        net_pay: 24000,
        created_at: '2025-01-01T00:00:00Z'
      }
    ]

    it('should create summary correctly', () => {
      const summary = PayrollDetailUtils.createPayrollDetailsSummary(mockDetails)
      
      expect(summary.total_employees).toBe(2)
      expect(summary.total_base_pay).toBe(55000) // 30000 + 25000
      expect(summary.total_bonus).toBe(2000)
      expect(summary.total_deduction).toBe(1500) // 500 + 1000
      expect(summary.total_net_pay).toBe(55500) // 31500 + 24000
      expect(summary.average_net_pay).toBe(27750) // 55500 / 2
    })

    it('should handle empty array', () => {
      const summary = PayrollDetailUtils.createPayrollDetailsSummary([])
      
      expect(summary.total_employees).toBe(0)
      expect(summary.total_base_pay).toBe(0)
      expect(summary.average_net_pay).toBe(0)
    })

    it('should round values correctly', () => {
      const detailsWithDecimals = [{
        ...mockDetails[0],
        base_pay: 30000.456,
        bonus: 1000.789,
        deduction: 500.123,
        net_pay: 30500.122
      }]
      
      const summary = PayrollDetailUtils.createPayrollDetailsSummary(detailsWithDecimals)
      
      expect(summary.total_base_pay).toBe(30000.46)
      expect(summary.total_bonus).toBe(1000.79)
      expect(summary.total_deduction).toBe(500.12)
    })
  })

  describe('createChangesSummary', () => {
    const oldValues = { bonus: 1000, deduction: 500, net_pay: 30500 }
    const newValues = { bonus: 2000, deduction: 300, net_pay: 31700 }
    const reasons = { bonus_reason: 'ผลงานดีเด่น', deduction_reason: 'มาสายลด' }

    it('should create changes summary correctly', () => {
      const summary = PayrollDetailUtils.createChangesSummary(
        'สมชาย ใจดี',
        oldValues,
        newValues,
        reasons
      )

      expect(summary.title).toBe('การเปลี่ยนแปลงเงินเดือนของ สมชาย ใจดี')
      expect(summary.changes).toHaveLength(2)
      expect(summary.changes[0]).toContain('เปลี่ยนโบนัสจาก ฿1,000.00 เป็น ฿2,000.00')
      expect(summary.changes[1]).toContain('เปลี่ยนการหักเงินจาก ฿500.00 เป็น ฿300.00')
      
      expect(summary.net_pay_impact.old_net_pay).toBe(30500)
      expect(summary.net_pay_impact.new_net_pay).toBe(31700)
      expect(summary.net_pay_impact.difference).toBe(1200) // 31700 - 30500
      expect(summary.net_pay_impact.impact_text).toContain('เงินเดือนสุทธิเพิ่มขึ้น ฿1,200.00')
    })

    it('should handle adding new bonus', () => {
      const oldValuesNoBonus = { bonus: 0, deduction: 0, net_pay: 30000 }
      const newValuesWithBonus = { bonus: 5000, deduction: 0, net_pay: 35000 }
      const reasonsBonus = { bonus_reason: 'โบนัสใหม่' }

      const summary = PayrollDetailUtils.createChangesSummary(
        'สมหญิง ขยัน',
        oldValuesNoBonus,
        newValuesWithBonus,
        reasonsBonus
      )

      expect(summary.changes).toHaveLength(1)
      expect(summary.changes[0]).toContain('เพิ่มโบนัส: ฿5,000.00 (โบนัสใหม่)')
      expect(summary.net_pay_impact.impact_text).toContain('เงินเดือนสุทธิเพิ่มขึ้น ฿5,000.00')
    })

    it('should handle removing bonus', () => {
      const oldValuesWithBonus = { bonus: 3000, deduction: 0, net_pay: 33000 }
      const newValuesNoBonus = { bonus: 0, deduction: 0, net_pay: 30000 }

      const summary = PayrollDetailUtils.createChangesSummary(
        'สมศักดิ์ ขยัน',
        oldValuesWithBonus,
        newValuesNoBonus,
        {}
      )

      expect(summary.changes).toHaveLength(1)
      expect(summary.changes[0]).toContain('ลบโบนัส: ฿3,000.00')
      expect(summary.net_pay_impact.impact_text).toContain('เงินเดือนสุทธิลดลง ฿3,000.00')
    })

    it('should handle no changes', () => {
      const sameValues = { bonus: 1000, deduction: 500, net_pay: 30500 }

      const summary = PayrollDetailUtils.createChangesSummary(
        'สมปอง เท่าเดิม',
        sameValues,
        sameValues,
        {}
      )

      expect(summary.changes).toHaveLength(0)
      expect(summary.net_pay_impact.difference).toBe(0)
      expect(summary.net_pay_impact.impact_text).toBe('เงินเดือนสุทธิไม่เปลี่ยนแปลง')
    })
  })

  describe('validateThaiInput', () => {
    it('should accept valid Thai input', () => {
      const result = PayrollDetailUtils.validateThaiInput('ผลงานดีเด่นประจำเดือน')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept Thai with numbers and English', () => {
      const result = PayrollDetailUtils.validateThaiInput('ผลงานดี 100% และ excellent work')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty input', () => {
      const result = PayrollDetailUtils.validateThaiInput('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('กรุณากรอกเหตุผล')
    })

    it('should reject whitespace only', () => {
      const result = PayrollDetailUtils.validateThaiInput('   ')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('กรุณากรอกเหตุผล')
    })

    it('should reject input that is too short', () => {
      const result = PayrollDetailUtils.validateThaiInput('AB')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('เหตุผลต้องมีความยาวอย่างน้อย 3 ตัวอักษร')
    })

    it('should reject input that is too long', () => {
      const longText = 'ก'.repeat(501)
      const result = PayrollDetailUtils.validateThaiInput(longText)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('เหตุผลต้องไม่เกิน 500 ตัวอักษร')
    })

    it('should reject special characters only', () => {
      const result = PayrollDetailUtils.validateThaiInput('!@#$%^&*()')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('เหตุผลต้องมีตัวอักษรหรือตัวเลข')
    })
  })

  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(PayrollDetailUtils.formatCurrency(30000)).toBe('฿30,000.00')
      expect(PayrollDetailUtils.formatCurrency(1250.50)).toBe('฿1,250.50')
    })

    it('should format negative amounts correctly', () => {
      expect(PayrollDetailUtils.formatCurrency(-1500)).toBe('-฿1,500.00')
    })

    it('should format zero correctly', () => {
      expect(PayrollDetailUtils.formatCurrency(0)).toBe('฿0.00')
    })
  })

  describe('calculatePercentageChange', () => {
    it('should calculate increase correctly', () => {
      const result = PayrollDetailUtils.calculatePercentageChange(100, 150)
      
      expect(result.percentage).toBe(50)
      expect(result.direction).toBe('increase')
      expect(result.formatted).toBe('50.0%')
    })

    it('should calculate decrease correctly', () => {
      const result = PayrollDetailUtils.calculatePercentageChange(100, 75)
      
      expect(result.percentage).toBe(-25)
      expect(result.direction).toBe('decrease')
      expect(result.formatted).toBe('25.0%')
    })

    it('should handle no change', () => {
      const result = PayrollDetailUtils.calculatePercentageChange(100, 100)
      
      expect(result.percentage).toBe(0)
      expect(result.direction).toBe('no_change')
      expect(result.formatted).toBe('0.0%')
    })

    it('should handle zero to positive change', () => {
      const result = PayrollDetailUtils.calculatePercentageChange(0, 100)
      
      expect(result.percentage).toBe(100)
      expect(result.direction).toBe('increase')
      expect(result.formatted).toBe('∞')
    })

    it('should handle both zero', () => {
      const result = PayrollDetailUtils.calculatePercentageChange(0, 0)
      
      expect(result.percentage).toBe(0)
      expect(result.direction).toBe('no_change')
      expect(result.formatted).toBe('0%')
    })
  })

  describe('generateLowNetPayWarning', () => {
    it('should warn for negative net pay', () => {
      const warning = PayrollDetailUtils.generateLowNetPayWarning(-1000, 30000)
      
      expect(warning).toContain('⚠️ เตือน: เงินเดือนสุทธิเป็น 0 หรือติดลบ')
    })

    it('should warn for zero net pay', () => {
      const warning = PayrollDetailUtils.generateLowNetPayWarning(0, 30000)
      
      expect(warning).toContain('⚠️ เตือน: เงินเดือนสุทธิเป็น 0 หรือติดลบ')
    })

    it('should warn for net pay < 50% of base pay', () => {
      const warning = PayrollDetailUtils.generateLowNetPayWarning(12000, 30000) // 40%
      
      expect(warning).toContain('⚠️ เตือน: เงินเดือนสุทธิต่ำกว่า 50% ของเงินเดือนพื้นฐาน')
    })

    it('should warn for net pay < 70% of base pay', () => {
      const warning = PayrollDetailUtils.generateLowNetPayWarning(18000, 30000) // 60%
      
      expect(warning).toContain('⚠️ แจ้งเตือน: เงินเดือนสุทธิต่ำกว่า 70% ของเงินเดือนพื้นฐาน')
    })

    it('should return null for normal net pay', () => {
      const warning = PayrollDetailUtils.generateLowNetPayWarning(25000, 30000) // 83%
      
      expect(warning).toBeNull()
    })

    it('should return null for net pay above base pay', () => {
      const warning = PayrollDetailUtils.generateLowNetPayWarning(35000, 30000)
      
      expect(warning).toBeNull()
    })
  })
})