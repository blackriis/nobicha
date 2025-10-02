/**
 * Payroll Calculation Utilities
 * ยูทิลิตีสำหรับการคำนวณเงินเดือนและค่าแรง
 */

export interface TimeEntry {
  check_in_time: string;
  check_out_time: string | null;
}

export interface EmployeeRates {
  hourly_rate: number;
  daily_rate: number;
}

export interface DayCalculation {
  date: string;
  hours: number;
  method: 'hourly' | 'daily';
  pay: number;
}

export interface PayrollCalculationInput {
  employeeRates: EmployeeRates;
  timeEntries: TimeEntry[];
  periodStart: string;
  periodEnd: string;
}

export interface PayrollCalculationOutput {
  totalHours: number;
  totalDaysWorked: number;
  basePay: number;
  calculationMethod: 'hourly' | 'daily' | 'mixed';
  dailyBreakdown: DayCalculation[];
}

/**
 * คำนวณจำนวนชั่วโมงการทำงานจาก check-in และ check-out
 */
export function calculateHoursWorked(checkInTime: string, checkOutTime: string): number {
  try {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    
    // Check for invalid dates
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return 0;
    }
    
    if (checkOut <= checkIn) {
      return 0;
    }
    
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const hours = diffMs / (1000 * 60 * 60); // Convert to hours
    
    // Round to 2 decimal places and ensure non-negative
    return Math.max(0, Math.round(hours * 100) / 100);
  } catch (error) {
    console.error('Error calculating hours worked:', error);
    return 0;
  }
}

/**
 * จัดกลุ่ม time entries ตามวันที่
 */
export function groupTimeEntriesByDate(
  timeEntries: TimeEntry[]
): Record<string, TimeEntry[]> {
  return timeEntries.reduce((acc, entry) => {
    try {
      const date = new Date(entry.check_in_time).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    } catch {
      // Skip invalid date entries
      return acc;
    }
  }, {} as Record<string, TimeEntry[]>);
}

/**
 * คำนวณค่าแรงสำหรับหนึ่งวัน
 */
export function calculateDayPay(
  dayTimeEntries: TimeEntry[],
  employeeRates: EmployeeRates
): DayCalculation {
  let totalHoursForDay = 0;
  
  // Calculate total hours for the day
  for (const entry of dayTimeEntries) {
    if (entry.check_out_time) {
      totalHoursForDay += calculateHoursWorked(entry.check_in_time, entry.check_out_time);
    }
  }
  
  // Round total hours
  totalHoursForDay = Math.round(totalHoursForDay * 100) / 100;
  
  const date = new Date(dayTimeEntries[0].check_in_time).toISOString().split('T')[0];
  
  // Apply business rule: >12 hours = daily rate, <=12 hours = hourly rate
  if (totalHoursForDay > 12) {
    return {
      date,
      hours: totalHoursForDay,
      method: 'daily',
      pay: parseFloat(employeeRates.daily_rate.toString())
    };
  } else {
    const hourlyPay = totalHoursForDay * parseFloat(employeeRates.hourly_rate.toString());
    return {
      date,
      hours: totalHoursForDay,
      method: 'hourly',
      pay: Math.round(hourlyPay * 100) / 100
    };
  }
}

/**
 * คำนวณเงินเดือนสำหรับพนักงานคนหนึ่ง
 */
export function calculateEmployeePayroll(
  input: PayrollCalculationInput
): PayrollCalculationOutput {
  const { employeeRates, timeEntries, periodStart, periodEnd } = input;
  
  // Filter time entries within the payroll period
  const periodEntries = timeEntries.filter(entry => {
    try {
      const entryDate = new Date(entry.check_in_time);
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      
      return entryDate >= startDate && entryDate <= endDate && entry.check_out_time;
    } catch {
      return false;
    }
  });
  
  // Group entries by date
  const entriesByDate = groupTimeEntriesByDate(periodEntries);
  
  // Calculate for each working day
  const dailyCalculations: DayCalculation[] = [];
  let totalHours = 0;
  let basePay = 0;
  
  for (const [date, dayEntries] of Object.entries(entriesByDate)) {
    const dayCalc = calculateDayPay(dayEntries, employeeRates);
    dailyCalculations.push(dayCalc);
    totalHours += dayCalc.hours;
    basePay += dayCalc.pay;
  }
  
  // Determine overall calculation method
  let calculationMethod: 'hourly' | 'daily' | 'mixed' = 'hourly';
  const methods = dailyCalculations.map(d => d.method);
  
  if (methods.length === 0) {
    calculationMethod = 'hourly';
  } else if (methods.every(m => m === 'daily')) {
    calculationMethod = 'daily';
  } else if (methods.every(m => m === 'hourly')) {
    calculationMethod = 'hourly';
  } else {
    calculationMethod = 'mixed';
  }
  
  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalDaysWorked: dailyCalculations.length,
    basePay: Math.round(basePay * 100) / 100,
    calculationMethod,
    dailyBreakdown: dailyCalculations.sort((a, b) => a.date.localeCompare(b.date))
  };
}

/**
 * ตรวจสอบว่าช่วงวันที่ทับซ้อนกันหรือไม่
 */
export function isDateRangeOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  try {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    
    return s1 <= e2 && s2 <= e1;
  } catch {
    return false;
  }
}

/**
 * จัดรูปแบบวันที่สำหรับ input date
 */
export function formatDateForInput(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * สร้างชื่อรอบการจ่ายเงินเดือนแบบอัตโนมัติ
 */
export function generatePayrollCycleName(startDate: string, endDate: string): string {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `เงินเดือน ${startDate} - ${endDate}`;
    }
    
    const startMonth = start.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' });
    const endMonth = end.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' });
    
    if (startMonth === endMonth) {
      return `เงินเดือน ${startMonth}`;
    } else {
      return `เงินเดือน ${startMonth} - ${endMonth}`;
    }
  } catch {
    return `เงินเดือน ${startDate} - ${endDate}`;
  }
}

/**
 * ตรวจสอบความถูกต้องของช่วงวันที่
 */
export function validateDateRange(startDate: string, endDate: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    if (!startDate || !endDate) {
      return { isValid: false, error: 'กรุณาระบุวันที่เริ่มต้นและสิ้นสุด' };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' };
    }
    
    if (start >= end) {
      return { isValid: false, error: 'วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด' };
    }
    
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 365) {
      return { isValid: false, error: 'ช่วงรอบการจ่ายเงินเดือนไม่ควรเกิน 1 ปี' };
    }
    
    const today = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(today.getFullYear() + 2);
    
    if (end > maxFutureDate) {
      return { isValid: false, error: 'วันที่สิ้นสุดไม่ควรเกิน 2 ปีจากปัจจุบัน' };
    }
    
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบวันที่' };
  }
}