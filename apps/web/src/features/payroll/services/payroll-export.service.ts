import { createClient } from '@/lib/supabase'

export interface PayrollCycle {
  id: string
  cycle_name: string
  start_date: string
  end_date: string
  pay_date: string
  status: 'active' | 'completed'
  total_amount: number
  created_at: string
  total_employees?: number
}

export interface PayrollDetail {
  id: string
  user_id: string
  base_pay: number
  overtime_pay: number
  bonus: number
  bonus_reason?: string
  deduction: number
  deduction_reason?: string
  net_pay: number
  calculation_method: string
  users: {
    id: string
    full_name: string
    employee_id?: string
    email?: string
    phone_number?: string
    branches?: {
      id: string
      name: string
      address?: string
    }
  }
}

export interface BranchBreakdown {
  branch_id: string
  branch_name: string
  employee_count: number
  total_net_pay: number
  total_base_pay: number
  total_bonus: number
  total_deduction: number
}

export interface EmployeeDetail {
  id: string
  user_id: string
  employee_name: string
  employee_id?: string
  branch_name: string
  base_pay: number
  overtime_pay: number
  bonus: number
  bonus_reason?: string
  deduction: number
  deduction_reason?: string
  net_pay: number
  calculation_method: string
}

export interface PayrollSummary {
  cycle_info: PayrollCycle
  totals: {
    total_employees: number
    total_base_pay: number
    total_overtime_pay: number
    total_bonus: number
    total_deduction: number
    total_net_pay: number
    average_net_pay: number
  }
  branch_breakdown: BranchBreakdown[]
  employee_details: EmployeeDetail[]
}

export interface ExportOptions {
  format: 'csv' | 'json'
  includeDetails?: boolean
  includeContactInfo?: boolean
  groupByBranch?: boolean
}

export class PayrollExportService {
  private supabase = createClient()

  // Format Thai date for display
  formatThaiDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  // Format currency in Thai format
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Get comprehensive payroll summary
  async getPayrollSummary(cycleId: string): Promise<PayrollSummary | null> {
    try {
      // Get cycle info
      const { data: cycle, error: cycleError } = await this.supabase
        .from('payroll_cycles')
        .select('*')
        .eq('id', cycleId)
        .single()

      if (cycleError || !cycle) {
        throw new Error('ไม่พบรอบการจ่ายเงินเดือนที่ระบุ')
      }

      // Get payroll details with employee information
      const { data: payrollDetails, error: detailsError } = await this.supabase
        .from('payroll_details')
        .select(`
          *,
          users!inner (
            id,
            full_name,
            employee_id,
            email,
            phone_number,
            branches (
              id,
              name,
              address
            )
          )
        `)
        .eq('payroll_cycle_id', cycleId)
        .order('users(full_name)', { ascending: true })

      if (detailsError) {
        throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดเงินเดือน')
      }

      const details = payrollDetails || []

      // Calculate totals
      const totalEmployees = details.length
      const totalBasePay = details.reduce((sum, detail) => sum + (detail.base_pay || 0), 0)
      const totalOvertimePay = details.reduce((sum, detail) => sum + (detail.overtime_pay || 0), 0)
      const totalBonus = details.reduce((sum, detail) => sum + (detail.bonus || 0), 0)
      const totalDeduction = details.reduce((sum, detail) => sum + (detail.deduction || 0), 0)
      const totalNetPay = details.reduce((sum, detail) => sum + (detail.net_pay || 0), 0)

      // Calculate branch breakdown
      const branchStats = details.reduce((acc, detail) => {
        const branchId = detail.users.branches?.id || 'no_branch'
        const branchName = detail.users.branches?.name || 'ไม่มีสาขา'
        
        if (!acc[branchId]) {
          acc[branchId] = {
            branch_id: branchId,
            branch_name: branchName,
            employee_count: 0,
            total_net_pay: 0,
            total_base_pay: 0,
            total_bonus: 0,
            total_deduction: 0
          }
        }
        
        acc[branchId].employee_count++
        acc[branchId].total_net_pay += detail.net_pay || 0
        acc[branchId].total_base_pay += detail.base_pay || 0
        acc[branchId].total_bonus += detail.bonus || 0
        acc[branchId].total_deduction += detail.deduction || 0
        
        return acc
      }, {} as Record<string, BranchBreakdown>)

      return {
        cycle_info: cycle,
        totals: {
          total_employees: totalEmployees,
          total_base_pay: totalBasePay,
          total_overtime_pay: totalOvertimePay,
          total_bonus: totalBonus,
          total_deduction: totalDeduction,
          total_net_pay: totalNetPay,
          average_net_pay: totalEmployees > 0 ? totalNetPay / totalEmployees : 0
        },
        branch_breakdown: Object.values(branchStats),
        employee_details: details.map(detail => ({
          id: detail.id,
          user_id: detail.user_id,
          employee_name: detail.users.full_name,
          employee_id: detail.users.employee_id,
          branch_name: detail.users.branches?.name || 'ไม่มีสาขา',
          base_pay: detail.base_pay,
          overtime_pay: detail.overtime_pay,
          bonus: detail.bonus,
          bonus_reason: detail.bonus_reason,
          deduction: detail.deduction,
          deduction_reason: detail.deduction_reason,
          net_pay: detail.net_pay,
          calculation_method: detail.calculation_method
        }))
      }
    } catch (error) {
      console.error('Error getting payroll summary:', error)
      return null
    }
  }

  // Generate CSV export content
  generateCSVContent(summary: PayrollSummary, options: ExportOptions = {}): string {
    let csvContent = '\uFEFF' // UTF-8 BOM for Excel compatibility
    
    const { cycle_info, totals, employee_details } = summary
    
    // Header information
    csvContent += `รายงานเงินเดือน: ${cycle_info.name}\n`
    csvContent += `ช่วงเวลา: ${this.formatThaiDate(cycle_info.start_date)} - ${this.formatThaiDate(cycle_info.end_date)}\n`
    csvContent += `สถานะ: ${cycle_info.status === 'completed' ? 'ปิดรอบแล้ว' : 'ยังไม่ปิดรอบ'}\n`
    if (cycle_info.finalized_at) {
      csvContent += `วันที่ปิดรอบ: ${this.formatThaiDate(cycle_info.finalized_at)}\n`
    }
    csvContent += `จำนวนพนักงาน: ${totals.total_employees} คน\n`
    csvContent += `เงินเดือนรวม: ${this.formatCurrency(totals.total_net_pay)}\n`
    csvContent += `วันที่สร้างรายงาน: ${this.formatThaiDate(new Date().toISOString())}\n\n`

    if (options.groupByBranch) {
      // Group by branch
      const branchGroups = employee_details.reduce((acc, emp) => {
        const branchName = emp.branch_name
        if (!acc[branchName]) {
          acc[branchName] = []
        }
        acc[branchName].push(emp)
        return acc
      }, {} as Record<string, typeof employee_details>)

      Object.entries(branchGroups).forEach(([branchName, employees]) => {
        csvContent += `=== ${branchName} ===\n`
        csvContent += 'ลำดับ,รหัสพนักงาน,ชื่อ-นามสกุล,ค่าแรงพื้นฐาน,ค่าล่วงเวลา,โบนัส,เหตุผลโบนัส,หักเงิน,เหตุผลหักเงิน,เงินเดือนสุทธิ,วิธีคำนวณ\n'
        
        employees.forEach((emp, index) => {
          const row = [
            index + 1,
            `"${emp.employee_id || ''}"`,
            `"${emp.employee_name || ''}"`,
            emp.base_pay || 0,
            emp.overtime_pay || 0,
            emp.bonus || 0,
            `"${emp.bonus_reason || ''}"`,
            emp.deduction || 0,
            `"${emp.deduction_reason || ''}"`,
            emp.net_pay || 0,
            `"${emp.calculation_method || ''}"`,
          ].join(',')
          
          csvContent += row + '\n'
        })
        csvContent += '\n'
      })
    } else {
      // Standard format
      csvContent += 'ลำดับ,รหัสพนักงาน,ชื่อ-นามสกุล,สาขา,ค่าแรงพื้นฐาน,ค่าล่วงเวลา,โบนัส,เหตุผลโบนัส,หักเงิน,เหตุผลหักเงิน,เงินเดือนสุทธิ,วิธีคำนวณ\n'

      employee_details.forEach((emp, index) => {
        const row = [
          index + 1,
          `"${emp.employee_id || ''}"`,
          `"${emp.employee_name || ''}"`,
          `"${emp.branch_name}"`,
          emp.base_pay || 0,
          emp.overtime_pay || 0,
          emp.bonus || 0,
          `"${emp.bonus_reason || ''}"`,
          emp.deduction || 0,
          `"${emp.deduction_reason || ''}"`,
          emp.net_pay || 0,
          `"${emp.calculation_method || ''}"`,
        ].join(',')
        
        csvContent += row + '\n'
      })
    }

    // Summary section
    csvContent += '\n=== สรุปยอดรวม ===\n'
    csvContent += `จำนวนพนักงานทั้งหมด,${totals.total_employees}\n`
    csvContent += `ค่าแรงพื้นฐานรวม,${totals.total_base_pay}\n`
    csvContent += `ค่าล่วงเวลารวม,${totals.total_overtime_pay}\n`
    csvContent += `โบนัสรวม,${totals.total_bonus}\n`
    csvContent += `หักเงินรวม,${totals.total_deduction}\n`
    csvContent += `เงินเดือนสุทธิรวม,${totals.total_net_pay}\n`
    csvContent += `เงินเดือนเฉลี่ย,${totals.average_net_pay.toFixed(2)}\n`

    return csvContent
  }

  // Get filename for export
  getExportFilename(cycleName: string, format: 'csv' | 'json'): string {
    const date = new Date().toISOString().split('T')[0]
    const cleanName = cycleName.replace(/\s+/g, '-').replace(/[^\w\-]/g, '')
    return `payroll-${cleanName}-${date}.${format}`
  }

  // Get historical finalized cycles
  async getHistoricalCycles(limit: number = 10): Promise<PayrollCycle[]> {
    try {
      const { data: cycles, error } = await this.supabase
        .from('payroll_cycles')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Database error getting historical cycles:', error)
        throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ')
      }

      return cycles || []
    } catch (error) {
      console.error('Error getting historical cycles:', error)
      return []
    }
  }

  // Validate cycle before finalization
  async validateCycleForFinalization(cycleId: string): Promise<{
    canFinalize: boolean
    issues: Array<{
      type: string
      message: string
      details?: unknown
    }>
  }> {
    try {
      const summary = await this.getPayrollSummary(cycleId)
      if (!summary) {
        return {
          canFinalize: false,
          issues: [{ type: 'not_found', message: 'ไม่พบรอบการจ่ายเงินเดือนที่ระบุ' }]
        }
      }

      const issues = []

      // Check if already completed
      if (summary.cycle_info.status === 'completed') {
        issues.push({
          type: 'already_completed',
          message: 'รอบการจ่ายเงินเดือนนี้ได้ถูกปิดแล้ว'
        })
      }

      // Check for employees with negative net pay
      const negativePayEmployees = summary.employee_details.filter(emp => emp.net_pay < 0)
      if (negativePayEmployees.length > 0) {
        issues.push({
          type: 'negative_net_pay',
          message: 'มีพนักงานที่มีเงินเดือนสุทธิติดลบ',
          details: negativePayEmployees.map(emp => ({
            name: emp.employee_name,
            employee_id: emp.employee_id,
            net_pay: emp.net_pay
          }))
        })
      }

      // Check for missing essential data
      const incompleteEmployees = summary.employee_details.filter(emp => 
        !emp.employee_name || 
        emp.base_pay === null || 
        emp.base_pay === undefined ||
        emp.net_pay === null ||
        emp.net_pay === undefined
      )
      
      if (incompleteEmployees.length > 0) {
        issues.push({
          type: 'incomplete_data',
          message: 'มีพนักงานที่ข้อมูลไม่ครบถ้วน',
          details: incompleteEmployees.map(emp => ({
            name: emp.employee_name || 'Unknown',
            employee_id: emp.employee_id,
            issues: 'ข้อมูลค่าแรงหรือเงินเดือนสุทธิไม่ครบถ้วน'
          }))
        })
      }

      return {
        canFinalize: issues.length === 0,
        issues
      }
    } catch (error) {
      console.error('Error validating cycle:', error)
      return {
        canFinalize: false,
        issues: [{ type: 'validation_error', message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' }]
      }
    }
  }
}

// Export singleton instance
export const payrollExportService = new PayrollExportService()