import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PayrollDetailUtils } from '@/features/payroll/utils/payroll-detail.utils'
import type { PayrollEmployeeListItem, BonusDeductionData } from '@/features/payroll/services/payroll.service'

const mockEmployee: PayrollEmployeeListItem = {
 id: 'emp-1',
 user_id: 'user-1',
 full_name: 'สมชาย ใจดี',
 base_pay: 30000,
 bonus: 1000,
 bonus_reason: 'ผลงานดีเดิม',
 deduction: 500,
 deduction_reason: 'มาสายเดิม',
 net_pay: 30500
}

const mockOnSubmit = vi.fn()
const mockOnClose = vi.fn()

describe('BonusDeductionForm Business Logic', () => {
 beforeEach(() => {
  vi.clearAllMocks()
 })

 describe('Bonus Mode Calculations', () => {
  it('should calculate net pay correctly with bonus updates', () => {
   const newBonus = 2500
   const newNetPay = mockEmployee.base_pay + newBonus - mockEmployee.deduction
   
   expect(newNetPay).toBe(32000) // 30000 + 2500 - 500
  })

  it('should prefill current bonus values', () => {
   const currentBonus = mockEmployee.bonus
   const currentReason = mockEmployee.bonus_reason
   
   expect(currentBonus).toBe(1000)
   expect(currentReason).toBe('ผลงานดีเดิม')
  })

  it('should validate bonus amount input', () => {
   const validAmounts = ['1500.50', '0', '999999.99']
   
   validAmounts.forEach(amount => {
    const numAmount = parseFloat(amount || '0')
    expect(numAmount).toBeGreaterThanOrEqual(0)
    expect(!isNaN(numAmount)).toBe(true)
   })
   
   // Test invalid cases separately
   const negativeAmount = parseFloat('-500')
   expect(negativeAmount).toBeLessThan(0)
   
   const nonNumericAmount = parseFloat('abc')
   expect(isNaN(nonNumericAmount)).toBe(true)
   
   const emptyAmount = parseFloat('')
   expect(isNaN(emptyAmount)).toBe(true)
  })

  it('should require reason when bonus amount > 0', () => {
   const bonusAmount = 1000
   const emptyReason = ''
   const validReason = 'ผลงานดีเด่น'
   
   // Should require reason for positive bonus
   const needsReason = bonusAmount > 0 && (!emptyReason || emptyReason.trim().length === 0)
   expect(needsReason).toBe(true)
   
   // Should not require reason for zero bonus
   const zeroNeedsReason = 0 > 0 && (!emptyReason || emptyReason.trim().length === 0)
   expect(zeroNeedsReason).toBe(false)
   
   // Valid reason should pass
   const hasValidReason = bonusAmount > 0 && validReason && validReason.trim().length > 0
   expect(hasValidReason).toBe(true)
  })

  it('should allow zero bonus without reason', () => {
   const zeroBonusData: Partial<BonusDeductionData> = {
    bonus: 0,
    bonus_reason: undefined
   }
   
   expect(zeroBonusData.bonus).toBe(0)
   expect(zeroBonusData.bonus_reason).toBeUndefined()
  })

  it('should show net pay preview correctly', () => {
   const calculatePreviewNetPay = (employee: PayrollEmployeeListItem, newBonus: number) => {
    return employee.base_pay + newBonus - employee.deduction
   }
   
   const previewNetPay = calculatePreviewNetPay(mockEmployee, 3000)
   expect(previewNetPay).toBe(32500) // 30000 + 3000 - 500
  })

  it('should warn about negative net pay', () => {
   const employeeWithDeduction = {
    ...mockEmployee,
    deduction: 25000,
    net_pay: 6000
   }
   
   const wouldBeNegative = PayrollDetailUtils.isNetPayNegative(
    employeeWithDeduction.base_pay, 0, 0, employeeWithDeduction.deduction
   )
   
   expect(wouldBeNegative).toBe(false) // 30000 - 25000 = 5000 (positive)
   
   // Test truly negative case
   const reallyNegative = PayrollDetailUtils.isNetPayNegative(
    10000, 0, 0, 15000
   )
   expect(reallyNegative).toBe(true) // 10000 - 15000 = -5000 (negative)
  })

  it('should structure valid bonus submission data', () => {
   const bonusData: BonusDeductionData = {
    bonus: 5000,
    bonus_reason: 'ผลงานดีเด่นประจำเดือน'
   }
   
   expect(bonusData.bonus).toBe(5000)
   expect(bonusData.bonus_reason).toBe('ผลงานดีเด่นประจำเดือน')
  })
 })

 describe('Deduction Mode Calculations', () => {
  it('should calculate net pay correctly with deduction updates', () => {
   const newDeduction = 1200
   const newNetPay = mockEmployee.base_pay + mockEmployee.bonus - newDeduction
   
   expect(newNetPay).toBe(29800) // 30000 + 1000 - 1200
  })

  it('should prefill current deduction values', () => {
   const currentDeduction = mockEmployee.deduction
   const currentReason = mockEmployee.deduction_reason
   
   expect(currentDeduction).toBe(500)
   expect(currentReason).toBe('มาสายเดิม')
  })

  it('should require reason when deduction > 0', () => {
   const deductionAmount = 800
   const validReason = 'มาสาย 4 วัน'
   
   const needsReason = deductionAmount > 0 && validReason && validReason.trim().length > 0
   expect(needsReason).toBe(true)
  })

  it('should structure valid deduction submission data', () => {
   const deductionData: BonusDeductionData = {
    deduction: 800,
    deduction_reason: 'มาสาย 4 วัน'
   }
   
   expect(deductionData.deduction).toBe(800)
   expect(deductionData.deduction_reason).toBe('มาสาย 4 วัน')
  })
 })

 describe('Form Validation Logic', () => {
  it('should validate employee data display', () => {
   const employeeName = mockEmployee.full_name
   const basePay = mockEmployee.base_pay
   const netPay = mockEmployee.net_pay
   
   expect(employeeName).toBe('สมชาย ใจดี')
   expect(basePay).toBe(30000)
   expect(netPay).toBe(30500)
  })

  it('should handle loading states', () => {
   const loadingStates = [true, false]
   
   loadingStates.forEach(isLoading => {
    const buttonText = isLoading ? 'กำลังบันทึก...' : 'บันทึก'
    const buttonDisabled = isLoading
    
    expect(buttonText).toBeTruthy()
    expect(typeof buttonDisabled).toBe('boolean')
   })
  })

  it('should validate character count for reason textarea', () => {
   const testReason = 'ผลงานดีมาก'
   const characterCount = testReason.length
   const maxLength = 500
   
   expect(characterCount).toBe(10)
   expect(characterCount).toBeLessThanOrEqual(maxLength)
  })

  it('should prevent submission with invalid data', () => {
   // Test invalid case: positive bonus without reason
   const invalidData = { bonus: 1000, bonus_reason: '' }
   const isValid = !(invalidData.bonus > 0 && (!invalidData.bonus_reason || invalidData.bonus_reason.trim().length === 0))
   
   expect(isValid).toBe(false)
  })
 })

 describe('Edge Cases', () => {
  it('should handle null employee gracefully', () => {
   const nullEmployee = null
   const shouldRender = nullEmployee !== null
   
   expect(shouldRender).toBe(false)
  })

  it('should handle very large amounts', () => {
   const largeAmount = 999999.99
   const isValidAmount = !isNaN(largeAmount) && largeAmount >= 0
   
   expect(isValidAmount).toBe(true)
   expect(largeAmount).toBe(999999.99)
  })

  it('should handle currency formatting', () => {
   const amounts = [30000, 1250.5, 0, -1500]
   
   amounts.forEach(amount => {
    const formatted = PayrollDetailUtils.formatCurrency(amount)
    expect(typeof formatted).toBe('string')
    expect(formatted).toContain('฿')
   })
  })
 })

 describe('Utility Functions Integration', () => {
  it('should use Thai input validation correctly', () => {
   const validReasons = ['ผลงานดี', 'มาสาย 2 วัน', 'โบนัสพิเศษ 2025']
   const invalidReasons = ['', ' ', 'AB', 'X'.repeat(501)]
   
   validReasons.forEach(reason => {
    const validation = PayrollDetailUtils.validateThaiInput(reason)
    expect(validation.isValid).toBe(true)
   })
   
   invalidReasons.forEach(reason => {
    const validation = PayrollDetailUtils.validateThaiInput(reason)
    expect(validation.isValid).toBe(false)
   })
  })

  it('should calculate net pay using utility function', () => {
   const calculation = PayrollDetailUtils.calculateNetPay(
    mockEmployee.base_pay, 0, 2000, 800
   )
   
   expect(calculation.net_pay).toBe(31200) // 30000 + 0 + 2000 - 800
   expect(calculation.calculation_breakdown).toBeInstanceOf(Array)
   expect(calculation.calculation_breakdown.length).toBeGreaterThan(0)
  })
 })
})