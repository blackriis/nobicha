import { ApiResponse, handleApiError } from '@/lib/utils';
import type { PayrollDetail, PayrollCycle } from '@employee-management/database';
import { createClient } from '@/lib/supabase';

export interface CreatePayrollCycleData {
  name: string;
  start_date: string;
  end_date: string;
}

export interface PayrollCalculationResult {
  employee_id: string;
  full_name: string;
  total_hours: number;
  total_days_worked: number;
  base_pay: number;
  calculation_method: 'hourly' | 'daily' | 'mixed';
}

export interface PayrollCalculationResponse {
  message: string;
  payroll_cycle: PayrollCycle;
  calculation_summary: {
    total_employees: number;
    total_base_pay: number;
    calculation_period: {
      start_date: string;
      end_date: string;
    };
  };
  employee_calculations: PayrollCalculationResult[];
}

export interface PayrollCyclesResponse {
  payroll_cycles: PayrollCycle[];
}

export interface CreatePayrollCycleResponse {
  message: string;
  payroll_cycle: PayrollCycle;
}

export interface PayrollEmployeeListItem {
  id: string;
  user_id: string;
  full_name: string;
  base_pay: number;
  bonus: number;
  bonus_reason?: string;
  deduction: number;
  deduction_reason?: string;
  net_pay: number;
}

export interface PayrollDetailsResponse {
  employees: PayrollEmployeeListItem[];
  cycle_info: PayrollCycle;
}

export interface BonusDeductionData {
  bonus?: number;
  bonus_reason?: string;
  deduction?: number;
  deduction_reason?: string;
}

export interface BonusDeductionResponse {
  message: string;
  data: PayrollDetail;
}

export interface PayrollSummaryResponse {
  message: string;
  summary: {
    cycle_info: {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: 'active' | 'completed';
      finalized_at?: string;
      created_at: string;
    };
    totals: {
      total_employees: number;
      total_base_pay: number;
      total_overtime_pay: number;
      total_bonus: number;
      total_deduction: number;
      total_net_pay: number;
      average_net_pay: number;
    };
    validation: {
      can_finalize: boolean;
      issues_count: number;
      employees_with_negative_net_pay: number;
      employees_with_missing_data: number;
      validation_issues: Array<{
        type: string;
        employee_name: string;
        employee_id?: string;
        details?: Record<string, unknown>;
      }>;
    };
    branch_breakdown: Array<{
      branch_id: string;
      branch_name: string;
      employee_count: number;
      total_net_pay: number;
      total_base_pay: number;
      total_bonus: number;
      total_deduction: number;
    }>;
    employee_details: Array<{
      id: string;
      user_id: string;
      employee_name: string;
      employee_id?: string;
      branch_name: string;
      base_pay: number;
      overtime_pay: number;
      bonus: number;
      bonus_reason?: string;
      deduction: number;
      deduction_reason?: string;
      net_pay: number;
      calculation_method: string;
    }>;
  };
}

export interface PayrollFinalizationResponse {
  message: string;
  finalization_summary: {
    cycle_info: {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      status: 'completed';
      finalized_at: string;
      finalized_by: string;
    };
    totals: {
      total_employees: number;
      total_base_pay: number;
      total_overtime_pay: number;
      total_bonus: number;
      total_deduction: number;
      total_net_pay: number;
    };
    finalization_details: {
      finalized_at: string;
      finalized_by_user_id: string;
      validation_passed: boolean;
      audit_log_created: boolean;
    };
  };
}

export interface PayrollAdjustmentPreview {
  employee_id: string;
  full_name: string;
  current_base_pay: number;
  current_bonus: number;
  current_deduction: number;
  current_net_pay: number;
  new_bonus?: number;
  new_deduction?: number;
  new_net_pay: number;
  adjustment_reason: string;
  adjustment_type: 'bonus' | 'deduction' | 'both';
}

export interface PayrollStats {
  activeCycles: number;
  totalEmployees: number;
  monthlyPayroll: number;
  pendingApprovals: number;
  growthPercentage: number;
  lastUpdated: string;
}

export class PayrollService {
  private static baseUrl = '/api/admin/payroll-cycles';
  private static supabase = createClient();

  private static async getAuthToken(): Promise<string> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Auth session error:', error.message);
        throw new Error('การยืนยันตัวตนล้มเหลว กรุณาเข้าสู่ระบบใหม่');
      }
      
      if (!session?.access_token) {
        throw new Error('ไม่พบข้อมูลการยืนยันตัวตน กรุณาเข้าสู่ระบบ');
      }
      
      return session.access_token;
    } catch (error) {
      console.error('Get auth token error:', error);
      throw error instanceof Error ? error : new Error('เกิดข้อผิดพลาดในการยืนยันตัวตน');
    }
  }

  /**
   * ดึงรายการรอบการจ่ายเงินเดือนทั้งหมด
   */
  static async getPayrollCycles(): Promise<ApiResponse<PayrollCyclesResponse>> {
    try {
      const authToken = await this.getAuthToken();
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลรอบการจ่ายเงินเดือน');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * สร้างรอบการจ่ายเงินเดือนใหม่
   */
  static async createPayrollCycle(
    cycleData: CreatePayrollCycleData
  ): Promise<ApiResponse<CreatePayrollCycleResponse>> {
    try {
      // Validation
      if (!cycleData.name?.trim()) {
        throw new Error('กรุณากรอกชื่อรอบการจ่ายเงินเดือน');
      }

      if (!cycleData.start_date) {
        throw new Error('กรุณาเลือกวันที่เริ่มต้น');
      }

      if (!cycleData.end_date) {
        throw new Error('กรุณาเลือกวันที่สิ้นสุด');
      }

      // Validate date range
      const startDate = new Date(cycleData.start_date);
      const endDate = new Date(cycleData.end_date);
      
      if (startDate >= endDate) {
        throw new Error('วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด');
      }

      // Check if dates are not in the future beyond reasonable limits
      const today = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(today.getFullYear() + 1);
      
      if (endDate > maxFutureDate) {
        throw new Error('วันที่สิ้นสุดไม่ควรเกินปีถัดไปจากปัจจุบัน');
      }

      const authToken = await this.getAuthToken();
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(cycleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการสร้างรอบการจ่ายเงินเดือน');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * คำนวณเงินเดือนสำหรับรอบที่ระบุ
   */
  static async calculatePayroll(
    cycleId: string
  ): Promise<ApiResponse<PayrollCalculationResponse>> {
    try {
      if (!cycleId?.trim()) {
        throw new Error('กรุณาระบุ ID ของรอบการจ่ายเงินเดือน');
      }

      const authToken = await this.getAuthToken();
      
      console.log('📡 Calling payroll calculation API:', {
        url: `${this.baseUrl}/${cycleId}/calculate`,
        cycleId,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${this.baseUrl}/${cycleId}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      console.log('📡 API Response status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const responseText = await response.text();
          console.error('📡 Raw API Response:', responseText);
          
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (jsonError) {
            console.error('Response is not valid JSON:', jsonError);
            errorData = { error: responseText || errorMessage };
          }
          
          console.error('📡 API Error Response:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          if (response.status === 401) {
            errorMessage = 'ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้ กรุณาเข้าสู่ระบบใหม่';
          } else if (response.status === 403) {
            errorMessage = 'ไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้';
          } else if (response.status >= 500) {
            errorMessage = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📡 API Success Response:', data);
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * ตรวจสอบรูปแบบวันที่
   */
  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
  }

  /**
   * จัดรูปแบบวันที่สำหรับแสดงผล (ไทย)
   */
  static formatDateThai(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * คำนวณจำนวนวันในรอบ
   */
  static calculatePeriodDays(startDate: string, endDate: string): number {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      const diffTime = end.getTime() - start.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    } catch {
      return 0;
    }
  }

  /**
   * จัดรูปแบบตัวเลขเงินเดือน
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * สร้างสรุปการคำนวณสำหรับแสดงผล
   */
  static generateCalculationSummary(calculations: PayrollCalculationResult[]): {
    totalEmployees: number;
    totalBasePay: number;
    averageBasePay: number;
    totalHours: number;
    averageHours: number;
    methodBreakdown: {
      hourly: number;
      daily: number;
      mixed: number;
    };
  } {
    const totalEmployees = calculations.length;
    const totalBasePay = calculations.reduce((sum, calc) => sum + calc.base_pay, 0);
    const totalHours = calculations.reduce((sum, calc) => sum + calc.total_hours, 0);
    
    const methodCounts = calculations.reduce(
      (counts, calc) => {
        counts[calc.calculation_method]++;
        return counts;
      },
      { hourly: 0, daily: 0, mixed: 0 }
    );

    return {
      totalEmployees,
      totalBasePay: Math.round(totalBasePay * 100) / 100,
      averageBasePay: totalEmployees > 0 ? Math.round((totalBasePay / totalEmployees) * 100) / 100 : 0,
      totalHours: Math.round(totalHours * 100) / 100,
      averageHours: totalEmployees > 0 ? Math.round((totalHours / totalEmployees) * 100) / 100 : 0,
      methodBreakdown: methodCounts,
    };
  }

  // === BONUS/DEDUCTION MANAGEMENT METHODS ===

  /**
   * อัปเดตโบนัสสำหรับพนักงาน
   */
  static async updateBonus(
    payrollDetailId: string,
    bonus: number,
    bonus_reason?: string
  ): Promise<ApiResponse<BonusDeductionResponse>> {
    try {
      if (!payrollDetailId?.trim()) {
        throw new Error('กรุณาระบุ ID ของรายละเอียดเงินเดือน');
      }

      if (typeof bonus !== 'number' || bonus < 0) {
        throw new Error('จำนวนโบนัสต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
      }

      if (bonus > 0 && (!bonus_reason || bonus_reason.trim().length === 0)) {
        throw new Error('กรุณาระบุเหตุผลในการให้โบนัส');
      }

      const response = await fetch(`/api/admin/payroll-details/${payrollDetailId}/bonus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bonus, bonus_reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัปเดตโบนัส');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * ลบโบนัสของพนักงาน
   */
  static async deleteBonus(
    payrollDetailId: string
  ): Promise<ApiResponse<BonusDeductionResponse>> {
    try {
      if (!payrollDetailId?.trim()) {
        throw new Error('กรุณาระบุ ID ของรายละเอียดเงินเดือน');
      }

      const response = await fetch(`/api/admin/payroll-details/${payrollDetailId}/bonus`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการลบโบนัส');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * อัปเดตการหักเงินสำหรับพนักงาน
   */
  static async updateDeduction(
    payrollDetailId: string,
    deduction: number,
    deduction_reason?: string
  ): Promise<ApiResponse<BonusDeductionResponse>> {
    try {
      if (!payrollDetailId?.trim()) {
        throw new Error('กรุณาระบุ ID ของรายละเอียดเงินเดือน');
      }

      if (typeof deduction !== 'number' || deduction < 0) {
        throw new Error('จำนวนหักเงินต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
      }

      if (deduction > 0 && (!deduction_reason || deduction_reason.trim().length === 0)) {
        throw new Error('กรุณาระบุเหตุผลในการหักเงิน');
      }

      const response = await fetch(`/api/admin/payroll-details/${payrollDetailId}/deduction`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deduction, deduction_reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัปเดตการหักเงิน');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * ลบการหักเงินของพนักงาน
   */
  static async deleteDeduction(
    payrollDetailId: string
  ): Promise<ApiResponse<BonusDeductionResponse>> {
    try {
      if (!payrollDetailId?.trim()) {
        throw new Error('กรุณาระบุ ID ของรายละเอียดเงินเดือน');
      }

      const response = await fetch(`/api/admin/payroll-details/${payrollDetailId}/deduction`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการลบการหักเงิน');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * สร้าง preview การปรับปรุงโบนัส/หักเงิน
   */
  static createAdjustmentPreview(
    employee: PayrollEmployeeListItem,
    adjustments: BonusDeductionData
  ): PayrollAdjustmentPreview {
    const newBonus = adjustments.bonus ?? employee.bonus;
    const newDeduction = adjustments.deduction ?? employee.deduction;
    const newNetPay = employee.base_pay + newBonus - newDeduction;

    let adjustmentType: 'bonus' | 'deduction' | 'both' = 'bonus';
    let adjustmentReason = '';

    if (adjustments.bonus !== undefined && adjustments.deduction !== undefined) {
      adjustmentType = 'both';
      adjustmentReason = `โบนัส: ${adjustments.bonus_reason || 'ไม่มีเหตุผล'}, หักเงิน: ${adjustments.deduction_reason || 'ไม่มีเหตุผล'}`;
    } else if (adjustments.deduction !== undefined) {
      adjustmentType = 'deduction';
      adjustmentReason = adjustments.deduction_reason || 'ไม่มีเหตุผล';
    } else {
      adjustmentReason = adjustments.bonus_reason || 'ไม่มีเหตุผล';
    }

    return {
      employee_id: employee.user_id,
      full_name: employee.full_name,
      current_base_pay: employee.base_pay,
      current_bonus: employee.bonus,
      current_deduction: employee.deduction,
      current_net_pay: employee.net_pay,
      new_bonus: newBonus,
      new_deduction: newDeduction,
      new_net_pay: newNetPay,
      adjustment_reason: adjustmentReason,
      adjustment_type: adjustmentType,
    };
  }

  /**
   * ตรวจสอบความถูกต้องของข้อมูลโบนัส/หักเงิน
   */
  static validateBonusDeductionData(data: BonusDeductionData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate bonus
    if (data.bonus !== undefined) {
      if (typeof data.bonus !== 'number' || data.bonus < 0) {
        errors.push('จำนวนโบนัสต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
      } else if (data.bonus > 0 && (!data.bonus_reason || data.bonus_reason.trim().length === 0)) {
        errors.push('กรุณาระบุเหตุผลในการให้โบนัส');
      } else if (data.bonus_reason && data.bonus_reason.trim().length > 500) {
        errors.push('เหตุผลโบนัสต้องไม่เกิน 500 ตัวอักษร');
      }
    }

    // Validate deduction
    if (data.deduction !== undefined) {
      if (typeof data.deduction !== 'number' || data.deduction < 0) {
        errors.push('จำนวนหักเงินต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
      } else if (data.deduction > 0 && (!data.deduction_reason || data.deduction_reason.trim().length === 0)) {
        errors.push('กรุณาระบุเหตุผลในการหักเงิน');
      } else if (data.deduction_reason && data.deduction_reason.trim().length > 500) {
        errors.push('เหตุผลหักเงินต้องไม่เกิน 500 ตัวอักษร');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // === PAYROLL FINALIZATION METHODS ===

  /**
   * ดึงสรุปข้อมูลรอบการจ่ายเงินเดือนก่อนปิดรอบ
   */
  static async getPayrollSummary(
    cycleId: string
  ): Promise<ApiResponse<PayrollSummaryResponse>> {
    try {
      if (!cycleId?.trim()) {
        throw new Error('กรุณาระบุ ID ของรอบการจ่ายเงินเดือน');
      }

      const authToken = await this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/${cycleId}/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปรอบการจ่ายเงินเดือน';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // Handle cases where response body is not JSON
          if (response.status === 404) {
            errorMessage = 'ไม่พบรอบการจ่ายเงินเดือนที่ระบุ';
          } else if (response.status === 401) {
            errorMessage = 'ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้ กรุณาเข้าสู่ระบบใหม่';
          } else if (response.status === 403) {
            errorMessage = 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * ปิดรอบการจ่ายเงินเดือน
   */
  static async finalizePayrollCycle(
    cycleId: string
  ): Promise<ApiResponse<PayrollFinalizationResponse>> {
    try {
      if (!cycleId?.trim()) {
        throw new Error('กรุณาระบุ ID ของรอบการจ่ายเงินเดือน');
      }

      const authToken = await this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/${cycleId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการปิดรอบการจ่ายเงินเดือน');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * ส่งออกรายงานเงินเดือน
   */
  static async exportPayrollReport(
    cycleId: string,
    format: 'csv' | 'json' = 'csv',
    includeDetails: boolean = true
  ): Promise<ApiResponse<Blob | object>> {
    try {
      if (!cycleId?.trim()) {
        throw new Error('กรุณาระบุ ID ของรอบการจ่ายเงินเดือน');
      }

      const params = new URLSearchParams({
        format,
        include_details: includeDetails.toString()
      });

      const response = await fetch(`${this.baseUrl}/${cycleId}/export?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการส่งออกรายงานเงินเดือน');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        return { success: true, data: blob };
      } else {
        const data = await response.json();
        return { success: true, data };
      }
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * ดาวน์โหลดไฟล์ CSV
   */
  static downloadCSVFile(blob: Blob, filename: string): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV file:', error);
      throw new Error('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
    }
  }

  /**
   * ตรวจสอบว่ารอบสามารถปิดได้หรือไม่
   */
  static canFinalizeCycle(summary: PayrollSummaryResponse['summary']): {
    canFinalize: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (summary.cycle_info.status === 'completed') {
      reasons.push('รอบการจ่ายเงินเดือนนี้ได้ถูกปิดแล้ว');
    }

    if (summary.validation.employees_with_negative_net_pay > 0) {
      reasons.push(`มีพนักงาน ${summary.validation.employees_with_negative_net_pay} คนที่มีเงินเดือนสุทธิติดลบ`);
    }

    if (summary.validation.employees_with_missing_data > 0) {
      reasons.push(`มีพนักงาน ${summary.validation.employees_with_missing_data} คนที่ข้อมูลไม่ครบถ้วน`);
    }

    if (summary.totals.total_employees === 0) {
      reasons.push('ไม่มีข้อมูลพนักงานในรอบนี้');
    }

    return {
      canFinalize: reasons.length === 0,
      reasons
    };
  }

  /**
   * ดึงสถิติของระบบเงินเดือน
   */
  static async getPayrollStats(): Promise<ApiResponse<PayrollStats>> {
    try {
      const authToken = await this.getAuthToken();
      const response = await fetch('/api/admin/payroll/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการดึงสถิติระบบเงินเดือน');
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('getPayrollStats error:', error);
      return handleApiError(error);
    }
  }

  /**
   * รีเซ็ตข้อมูลเงินเดือนสำหรับรอบที่ระบุ
   */
  static async resetPayrollCycle(
    cycleId: string
  ): Promise<ApiResponse<{ message: string; cycle_id: string }>> {
    try {
      if (!cycleId?.trim()) {
        throw new Error('กรุณาระบุ ID ของรอบการจ่ายเงินเดือน');
      }

      const authToken = await this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/${cycleId}/reset`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการรีเซ็ตข้อมูลเงินเดือน');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  }
}