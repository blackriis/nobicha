import type { PayrollDetail } from '@employee-management/database'

export interface NetPayCalculation {
  base_pay: number
  overtime_pay: number
  bonus: number
  deduction: number
  net_pay: number
  calculation_breakdown: string[]
}

export interface PayrollDetailSummary {
  total_employees: number
  total_base_pay: number
  total_bonus: number
  total_deduction: number
  total_net_pay: number
  average_net_pay: number
}

export class PayrollDetailUtils {
  /**
   * คำนวณ net_pay สำหรับ payroll detail
   * สูตร: base_pay + overtime_pay + bonus - deduction
   */
  static calculateNetPay(
    base_pay: number,
    overtime_pay: number = 0,
    bonus: number = 0,
    deduction: number = 0
  ): NetPayCalculation {
    const net_pay = base_pay + overtime_pay + bonus - deduction
    
    const calculation_breakdown = [
      `เงินเดือนพื้นฐาน: ${this.formatCurrency(base_pay)}`,
      overtime_pay > 0 ? `ค่าล่วงเวลา: ${this.formatCurrency(overtime_pay)}` : null,
      bonus > 0 ? `โบนัส: ${this.formatCurrency(bonus)}` : null,
      deduction > 0 ? `หักเงิน: -${this.formatCurrency(deduction)}` : null,
      `= เงินเดือนสุทธิ: ${this.formatCurrency(net_pay)}`
    ].filter(Boolean) as string[]

    return {
      base_pay,
      overtime_pay,
      bonus,
      deduction,
      net_pay,
      calculation_breakdown
    }
  }

  /**
   * ตรวจสอบว่า net_pay เป็นค่าลบหรือไม่
   */
  static isNetPayNegative(
    base_pay: number,
    overtime_pay: number = 0,
    bonus: number = 0,
    deduction: number = 0
  ): boolean {
    return (base_pay + overtime_pay + bonus - deduction) < 0
  }

  /**
   * สร้างสรุปสำหรับหลายๆ payroll details
   */
  static createPayrollDetailsSummary(details: PayrollDetail[]): PayrollDetailSummary {
    const total_employees = details.length
    const total_base_pay = details.reduce((sum, detail) => sum + detail.base_pay, 0)
    const total_bonus = details.reduce((sum, detail) => sum + detail.bonus, 0)
    const total_deduction = details.reduce((sum, detail) => sum + detail.deduction, 0)
    const total_net_pay = details.reduce((sum, detail) => sum + detail.net_pay, 0)
    const average_net_pay = total_employees > 0 ? total_net_pay / total_employees : 0

    return {
      total_employees,
      total_base_pay: Math.round(total_base_pay * 100) / 100,
      total_bonus: Math.round(total_bonus * 100) / 100,
      total_deduction: Math.round(total_deduction * 100) / 100,
      total_net_pay: Math.round(total_net_pay * 100) / 100,
      average_net_pay: Math.round(average_net_pay * 100) / 100
    }
  }

  /**
   * สร้างข้อความสรุปการเปลี่ยนแปลงสำหรับ Admin
   */
  static createChangesSummary(
    employee_name: string,
    old_values: { bonus: number; deduction: number; net_pay: number },
    new_values: { bonus: number; deduction: number; net_pay: number },
    reasons: { bonus_reason?: string; deduction_reason?: string }
  ): {
    title: string
    changes: string[]
    net_pay_impact: {
      old_net_pay: number
      new_net_pay: number
      difference: number
      impact_text: string
    }
  } {
    const changes: string[] = []
    
    // Bonus changes
    if (old_values.bonus !== new_values.bonus) {
      if (old_values.bonus === 0 && new_values.bonus > 0) {
        changes.push(`เพิ่มโบนัส: ${this.formatCurrency(new_values.bonus)} (${reasons.bonus_reason || 'ไม่มีเหตุผล'})`)
      } else if (old_values.bonus > 0 && new_values.bonus === 0) {
        changes.push(`ลบโบนัส: ${this.formatCurrency(old_values.bonus)}`)
      } else {
        changes.push(`เปลี่ยนโบนัสจาก ${this.formatCurrency(old_values.bonus)} เป็น ${this.formatCurrency(new_values.bonus)} (${reasons.bonus_reason || 'ไม่มีเหตุผล'})`)
      }
    }

    // Deduction changes
    if (old_values.deduction !== new_values.deduction) {
      if (old_values.deduction === 0 && new_values.deduction > 0) {
        changes.push(`เพิ่มการหักเงิน: ${this.formatCurrency(new_values.deduction)} (${reasons.deduction_reason || 'ไม่มีเหตุผล'})`)
      } else if (old_values.deduction > 0 && new_values.deduction === 0) {
        changes.push(`ลบการหักเงิน: ${this.formatCurrency(old_values.deduction)}`)
      } else {
        changes.push(`เปลี่ยนการหักเงินจาก ${this.formatCurrency(old_values.deduction)} เป็น ${this.formatCurrency(new_values.deduction)} (${reasons.deduction_reason || 'ไม่มีเหตุผล'})`)
      }
    }

    const difference = new_values.net_pay - old_values.net_pay
    let impact_text = ''
    
    if (difference > 0) {
      impact_text = `เงินเดือนสุทธิเพิ่มขึ้น ${this.formatCurrency(difference)}`
    } else if (difference < 0) {
      impact_text = `เงินเดือนสุทธิลดลง ${this.formatCurrency(Math.abs(difference))}`
    } else {
      impact_text = 'เงินเดือนสุทธิไม่เปลี่ยนแปลง'
    }

    return {
      title: `การเปลี่ยนแปลงเงินเดือนของ ${employee_name}`,
      changes,
      net_pay_impact: {
        old_net_pay: old_values.net_pay,
        new_net_pay: new_values.net_pay,
        difference,
        impact_text
      }
    }
  }

  /**
   * ตรวจสอบ input ภาษาไทยสำหรับเหตุผล
   */
  static validateThaiInput(text: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!text || text.trim().length === 0) {
      errors.push('กรุณากรอกเหตุผล')
      return { isValid: false, errors }
    }

    const trimmedText = text.trim()

    // Check minimum length
    if (trimmedText.length < 3) {
      errors.push('เหตุผลต้องมีความยาวอย่างน้อย 3 ตัวอักษร')
    }

    // Check maximum length
    if (trimmedText.length > 500) {
      errors.push('เหตุผลต้องไม่เกิน 500 ตัวอักษร')
    }

    // Check for only whitespace or special characters
    if (!/[\u0E00-\u0E7Fa-zA-Z0-9]/.test(trimmedText)) {
      errors.push('เหตุผลต้องมีตัวอักษรหรือตัวเลข')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * จัดรูปแบบเงินเป็นภาษาไทย
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  /**
   * คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
   */
  static calculatePercentageChange(oldValue: number, newValue: number): {
    percentage: number
    direction: 'increase' | 'decrease' | 'no_change'
    formatted: string
  } {
    if (oldValue === 0 && newValue === 0) {
      return { percentage: 0, direction: 'no_change', formatted: '0%' }
    }

    if (oldValue === 0) {
      return { percentage: 100, direction: 'increase', formatted: '∞' }
    }

    const percentage = ((newValue - oldValue) / Math.abs(oldValue)) * 100
    const direction = percentage > 0 ? 'increase' : percentage < 0 ? 'decrease' : 'no_change'
    const formatted = `${Math.abs(percentage).toFixed(1)}%`

    return { percentage, direction, formatted }
  }

  /**
   * สร้าง warning message หากเงินเดือนสุทธิต่ำมาก
   */
  static generateLowNetPayWarning(net_pay: number, base_pay: number): string | null {
    const percentage = (net_pay / base_pay) * 100

    if (net_pay <= 0) {
      return '⚠️ เตือน: เงินเดือนสุทธิเป็น 0 หรือติดลบ กรุณาตรวจสอบการหักเงิน'
    }

    if (percentage < 50) {
      return '⚠️ เตือน: เงินเดือนสุทธิต่ำกว่า 50% ของเงินเดือนพื้นฐาน'
    }

    if (percentage < 70) {
      return '⚠️ แจ้งเตือน: เงินเดือนสุทธิต่ำกว่า 70% ของเงินเดือนพื้นฐาน'
    }

    return null
  }
}