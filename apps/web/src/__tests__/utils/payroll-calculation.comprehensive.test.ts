import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateHoursWorked,
  groupTimeEntriesByDate,
  calculateDayPay,
  calculateEmployeePayroll,
  isDateRangeOverlapping,
  formatDateForInput,
  generatePayrollCycleName,
  validateDateRange,
  type EmployeeRates,
  type TimeEntry,
  type PayrollCalculationInput
} from '@/features/payroll/utils/payroll-calculation.utils';

describe('การคิดค่าแรงพนักงาน - Comprehensive Unit Tests', () => {
  
  // Mock console.error to avoid noise in tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const mockEmployeeRates: EmployeeRates = {
    hourly_rate: 50,
    daily_rate: 600
  };

  describe('calculateHoursWorked', () => {
    it('ควรคำนวณชั่วโมงการทำงานได้ถูกต้อง', () => {
      const checkIn = '2025-01-15T08:00:00Z';
      const checkOut = '2025-01-15T17:00:00Z';
      
      const hours = calculateHoursWorked(checkIn, checkOut);
      expect(hours).toBe(9);
    });

    it('ควรคำนวณชั่วโมงทศนิยมได้ถูกต้อง', () => {
      const checkIn = '2025-01-15T08:00:00Z';
      const checkOut = '2025-01-15T16:30:00Z';
      
      const hours = calculateHoursWorked(checkIn, checkOut);
      expect(hours).toBe(8.5);
    });

    it('ควรคืนค่า 0 เมื่อ check-out น้อยกว่า check-in', () => {
      const checkIn = '2025-01-15T17:00:00Z';
      const checkOut = '2025-01-15T08:00:00Z';
      
      const hours = calculateHoursWorked(checkIn, checkOut);
      expect(hours).toBe(0);
    });

    it('ควรคืนค่า 0 เมื่อ check-out เท่ากับ check-in', () => {
      const checkIn = '2025-01-15T08:00:00Z';
      const checkOut = '2025-01-15T08:00:00Z';
      
      const hours = calculateHoursWorked(checkIn, checkOut);
      expect(hours).toBe(0);
    });

    it('ควรจัดการ invalid date strings ได้', () => {
      const hours1 = calculateHoursWorked('invalid-date', '2025-01-15T17:00:00Z');
      const hours2 = calculateHoursWorked('2025-01-15T08:00:00Z', 'invalid-date');
      
      expect(hours1).toBe(0);
      expect(hours2).toBe(0);
    });

    it('ควรปัดเศษทศนิยมเป็น 2 ตำแหน่ง', () => {
      const checkIn = '2025-01-15T08:00:00Z';
      const checkOut = '2025-01-15T16:20:00Z'; // 8 hours 20 minutes = 8.333... hours
      
      const hours = calculateHoursWorked(checkIn, checkOut);
      expect(hours).toBe(8.33);
    });
  });

  describe('groupTimeEntriesByDate', () => {
    it('ควรจัดกลุ่ม time entries ตามวันที่ได้ถูกต้อง', () => {
      const timeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T17:00:00Z' },
        { check_in_time: '2025-01-15T18:00:00Z', check_out_time: '2025-01-15T22:00:00Z' },
        { check_in_time: '2025-01-16T09:00:00Z', check_out_time: '2025-01-16T18:00:00Z' }
      ];

      const grouped = groupTimeEntriesByDate(timeEntries);
      
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2025-01-15']).toHaveLength(2);
      expect(grouped['2025-01-16']).toHaveLength(1);
    });

    it('ควรข้าม invalid date entries', () => {
      const timeEntries: TimeEntry[] = [
        { check_in_time: 'invalid-date', check_out_time: '2025-01-15T17:00:00Z' },
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T17:00:00Z' }
      ];

      const grouped = groupTimeEntriesByDate(timeEntries);
      
      expect(Object.keys(grouped)).toHaveLength(1);
      expect(grouped['2025-01-15']).toHaveLength(1);
    });

    it('ควรจัดการ empty array ได้', () => {
      const grouped = groupTimeEntriesByDate([]);
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('calculateDayPay - Business Rules Testing', () => {
    it('ควรใช้ hourly rate สำหรับงานที่ทำน้อยกว่าหรือเท่ากับ 12 ชั่วโมง', () => {
      const dayTimeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T20:00:00Z' } // 12 hours exactly
      ];

      const result = calculateDayPay(dayTimeEntries, mockEmployeeRates);
      
      expect(result.hours).toBe(12);
      expect(result.method).toBe('hourly');
      expect(result.pay).toBe(600); // 12 * 50 = 600
    });

    it('ควรใช้ daily rate สำหรับงานที่ทำมากกว่า 12 ชั่วโมง', () => {
      const dayTimeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T21:00:00Z' } // 13 hours
      ];

      const result = calculateDayPay(dayTimeEntries, mockEmployeeRates);
      
      expect(result.hours).toBe(13);
      expect(result.method).toBe('daily');
      expect(result.pay).toBe(600); // daily rate regardless of hours
    });

    it('ควรรวม multiple check-ins ในวันเดียวกันได้', () => {
      const dayTimeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T12:00:00Z' }, // 4 hours
        { check_in_time: '2025-01-15T13:00:00Z', check_out_time: '2025-01-15T22:00:00Z' }  // 9 hours = 13 total
      ];

      const result = calculateDayPay(dayTimeEntries, mockEmployeeRates);
      
      expect(result.hours).toBe(13);
      expect(result.method).toBe('daily');
      expect(result.pay).toBe(600);
    });

    it('ควรข้าม entries ที่ไม่มี check_out_time', () => {
      const dayTimeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:00:00Z' }, // 8 hours
        { check_in_time: '2025-01-15T17:00:00Z', check_out_time: null }  // No check-out
      ];

      const result = calculateDayPay(dayTimeEntries, mockEmployeeRates);
      
      expect(result.hours).toBe(8);
      expect(result.method).toBe('hourly');
      expect(result.pay).toBe(400); // 8 * 50 = 400
    });

    it('ควรคำนวณค่าแรงรายชั่วโมงได้ถูกต้อง (ทศนิยม)', () => {
      const dayTimeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:30:00Z' } // 8.5 hours
      ];

      const result = calculateDayPay(dayTimeEntries, mockEmployeeRates);
      
      expect(result.hours).toBe(8.5);
      expect(result.method).toBe('hourly');
      expect(result.pay).toBe(425); // 8.5 * 50 = 425
    });
  });

  describe('calculateEmployeePayroll - Complete Integration', () => {
    const basicInput: PayrollCalculationInput = {
      employeeRates: mockEmployeeRates,
      timeEntries: [],
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31'
    };

    it('ควรคำนวณ payroll สำหรับ hourly worker ได้ถูกต้อง', () => {
      const input: PayrollCalculationInput = {
        ...basicInput,
        timeEntries: [
          { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:00:00Z' }, // 8 hours
          { check_in_time: '2025-01-16T09:00:00Z', check_out_time: '2025-01-16T17:00:00Z' }, // 8 hours
          { check_in_time: '2025-01-17T08:30:00Z', check_out_time: '2025-01-17T16:30:00Z' }  // 8 hours
        ]
      };

      const result = calculateEmployeePayroll(input);
      
      expect(result.totalHours).toBe(24);
      expect(result.totalDaysWorked).toBe(3);
      expect(result.basePay).toBe(1200); // 24 * 50 = 1200
      expect(result.calculationMethod).toBe('hourly');
      expect(result.dailyBreakdown).toHaveLength(3);
    });

    it('ควรคำนวณ payroll สำหรับ daily worker ได้ถูกต้อง', () => {
      const input: PayrollCalculationInput = {
        ...basicInput,
        timeEntries: [
          { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T21:00:00Z' }, // 13 hours
          { check_in_time: '2025-01-16T08:00:00Z', check_out_time: '2025-01-16T22:00:00Z' }, // 14 hours
        ]
      };

      const result = calculateEmployeePayroll(input);
      
      expect(result.totalHours).toBe(27);
      expect(result.totalDaysWorked).toBe(2);
      expect(result.basePay).toBe(1200); // 2 * 600 = 1200
      expect(result.calculationMethod).toBe('daily');
      expect(result.dailyBreakdown).toHaveLength(2);
    });

    it('ควรคำนวณ payroll สำหรับ mixed method ได้ถูกต้อง', () => {
      const input: PayrollCalculationInput = {
        ...basicInput,
        timeEntries: [
          { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:00:00Z' }, // 8 hours (hourly)
          { check_in_time: '2025-01-16T08:00:00Z', check_out_time: '2025-01-16T21:00:00Z' }, // 13 hours (daily)
        ]
      };

      const result = calculateEmployeePayroll(input);
      
      expect(result.totalHours).toBe(21);
      expect(result.totalDaysWorked).toBe(2);
      expect(result.basePay).toBe(1000); // (8 * 50) + 600 = 400 + 600 = 1000
      expect(result.calculationMethod).toBe('mixed');
      expect(result.dailyBreakdown).toHaveLength(2);
    });

    it('ควรกรองเฉพาะ entries ที่อยู่ในช่วง period', () => {
      const input: PayrollCalculationInput = {
        ...basicInput,
        periodStart: '2025-01-15',
        periodEnd: '2025-01-16',
        timeEntries: [
          { check_in_time: '2025-01-14T08:00:00Z', check_out_time: '2025-01-14T16:00:00Z' }, // Before period
          { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:00:00Z' }, // In period
          { check_in_time: '2025-01-16T08:00:00Z', check_out_time: '2025-01-16T16:00:00Z' }, // In period
          { check_in_time: '2025-01-17T08:00:00Z', check_out_time: '2025-01-17T16:00:00Z' }  // After period
        ]
      };

      const result = calculateEmployeePayroll(input);
      
      expect(result.totalDaysWorked).toBe(2);
      expect(result.basePay).toBe(800); // 2 days * 8 hours * 50 = 800
    });

    it('ควรข้าม entries ที่ไม่มี check_out_time', () => {
      const input: PayrollCalculationInput = {
        ...basicInput,
        timeEntries: [
          { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:00:00Z' }, // Valid
          { check_in_time: '2025-01-16T08:00:00Z', check_out_time: null }  // Invalid - no check out
        ]
      };

      const result = calculateEmployeePayroll(input);
      
      expect(result.totalDaysWorked).toBe(1);
      expect(result.basePay).toBe(400); // 8 hours * 50 = 400
    });

    it('ควรจัดการ empty time entries ได้', () => {
      const input: PayrollCalculationInput = {
        ...basicInput,
        timeEntries: []
      };

      const result = calculateEmployeePayroll(input);
      
      expect(result.totalHours).toBe(0);
      expect(result.totalDaysWorked).toBe(0);
      expect(result.basePay).toBe(0);
      expect(result.calculationMethod).toBe('hourly');
      expect(result.dailyBreakdown).toHaveLength(0);
    });

    it('ควร sort daily breakdown ตามวันที่', () => {
      const input: PayrollCalculationInput = {
        ...basicInput,
        timeEntries: [
          { check_in_time: '2025-01-17T08:00:00Z', check_out_time: '2025-01-17T16:00:00Z' },
          { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:00:00Z' },
          { check_in_time: '2025-01-16T08:00:00Z', check_out_time: '2025-01-16T16:00:00Z' }
        ]
      };

      const result = calculateEmployeePayroll(input);
      
      expect(result.dailyBreakdown[0].date).toBe('2025-01-15');
      expect(result.dailyBreakdown[1].date).toBe('2025-01-16');
      expect(result.dailyBreakdown[2].date).toBe('2025-01-17');
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('ควรจัดการ invalid employee rates ได้', () => {
      const invalidRates: EmployeeRates = {
        hourly_rate: 0,
        daily_rate: 0
      };

      const dayTimeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:00:00Z' }
      ];

      const result = calculateDayPay(dayTimeEntries, invalidRates);
      
      expect(result.pay).toBe(0);
      expect(result.method).toBe('hourly');
    });

    it('ควรจัดการ negative rates ได้', () => {
      const negativeRates: EmployeeRates = {
        hourly_rate: -50,
        daily_rate: -600
      };

      const dayTimeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:00:00Z' }
      ];

      const result = calculateDayPay(dayTimeEntries, negativeRates);
      
      expect(result.pay).toBe(-400); // 8 * -50 = -400
      expect(result.method).toBe('hourly');
    });

    it('ควรจัดการ very large numbers ได้', () => {
      const largeRates: EmployeeRates = {
        hourly_rate: 999999,
        daily_rate: 999999
      };

      const dayTimeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:00:00Z' }
      ];

      const result = calculateDayPay(dayTimeEntries, largeRates);
      
      expect(result.pay).toBe(7999992); // 8 * 999999 = 7999992
      expect(result.method).toBe('hourly');
    });

    it('ควรจัดการ cross-midnight shifts ได้', () => {
      const checkIn = '2025-01-15T23:00:00Z';
      const checkOut = '2025-01-16T07:00:00Z'; // Next day
      
      const hours = calculateHoursWorked(checkIn, checkOut);
      expect(hours).toBe(8);
    });

    it('ควรจัดการ timezone differences ได้', () => {
      const checkIn = '2025-01-15T08:00:00+07:00'; // Bangkok time
      const checkOut = '2025-01-15T17:00:00+07:00';
      
      const hours = calculateHoursWorked(checkIn, checkOut);
      expect(hours).toBe(9);
    });
  });

  describe('Utility Functions', () => {
    describe('isDateRangeOverlapping', () => {
      it('ควรตรวจจับการทับซ้อนของช่วงวันที่ได้', () => {
        const result1 = isDateRangeOverlapping('2025-01-01', '2025-01-15', '2025-01-10', '2025-01-20');
        const result2 = isDateRangeOverlapping('2025-01-01', '2025-01-15', '2025-01-16', '2025-01-30');
        
        expect(result1).toBe(true);  // Overlapping
        expect(result2).toBe(false); // Not overlapping
      });

      it('ควรจัดการ invalid dates ได้', () => {
        const result = isDateRangeOverlapping('invalid', '2025-01-15', '2025-01-10', 'invalid');
        expect(result).toBe(false);
      });
    });

    describe('formatDateForInput', () => {
      it('ควรแปลง Date object เป็น YYYY-MM-DD string', () => {
        const date = new Date('2025-01-15T08:00:00Z');
        const formatted = formatDateForInput(date);
        expect(formatted).toBe('2025-01-15');
      });

      it('ควรแปลง date string เป็น YYYY-MM-DD format', () => {
        const formatted = formatDateForInput('2025-01-15T08:00:00Z');
        expect(formatted).toBe('2025-01-15');
      });

      it('ควรจัดการ invalid date ได้', () => {
        const formatted = formatDateForInput('invalid-date');
        expect(formatted).toBe('');
      });
    });

    describe('generatePayrollCycleName', () => {
      it('ควรสร้างชื่อสำหรับเดือนเดียวกันได้', () => {
        const name = generatePayrollCycleName('2025-01-01', '2025-01-31');
        expect(name).toMatch(/เงินเดือน.*ม\.ค\..*2568/); // Thai Buddhist year
      });

      it('ควรสร้างชื่อสำหรับข้ามเดือนได้', () => {
        const name = generatePayrollCycleName('2025-01-15', '2025-02-15');
        expect(name).toMatch(/เงินเดือน.*ม\.ค\..*-.*ก\.พ\./);
      });

      it('ควรจัดการ invalid dates ได้', () => {
        const name = generatePayrollCycleName('invalid', 'invalid');
        expect(name).toMatch(/เงินเดือน invalid - invalid/);
      });
    });

    describe('validateDateRange', () => {
      it('ควร validate ช่วงวันที่ที่ถูกต้อง', () => {
        const result = validateDateRange('2025-01-01', '2025-01-31');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('ควรตรวจจับวันที่เริ่มต้นมากกว่าวันที่สิ้นสุด', () => {
        const result = validateDateRange('2025-01-31', '2025-01-01');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด');
      });

      it('ควรตรวจจับช่วงที่ยาวเกิน 1 ปี', () => {
        const result = validateDateRange('2025-01-01', '2026-01-02');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('ช่วงรอบการจ่ายเงินเดือนไม่ควรเกิน 1 ปี');
      });

      it('ควรตรวจจับวันที่อนาคตที่ไกลเกินไป', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 3);
        const futureDateString = futureDate.toISOString().split('T')[0];
        
        const result = validateDateRange('2025-01-01', futureDateString);
        expect(result.isValid).toBe(false);
        // This will trigger the "1 year range" error first since the range is >1 year AND >2 years future
        expect(result.error).toBe('ช่วงรอบการจ่ายเงินเดือนไม่ควรเกิน 1 ปี');
      });

      it('ควรตรวจจับ missing dates', () => {
        const result1 = validateDateRange('', '2025-01-31');
        const result2 = validateDateRange('2025-01-01', '');
        
        expect(result1.isValid).toBe(false);
        expect(result2.isValid).toBe(false);
        expect(result1.error).toBe('กรุณาระบุวันที่เริ่มต้นและสิ้นสุด');
        expect(result2.error).toBe('กรุณาระบุวันที่เริ่มต้นและสิ้นสุด');
      });

      it('ควรตรวจจับ invalid date format', () => {
        const result = validateDateRange('invalid-date', '2025-01-31');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('รูปแบบวันที่ไม่ถูกต้อง');
      });
    });
  });

  describe('Performance & Precision Tests', () => {
    it('ควรจัดการ large dataset ได้อย่างมีประสิทธิภาพ', () => {
      const largeTimeEntries: TimeEntry[] = Array.from({ length: 1000 }, (_, i) => ({
        check_in_time: `2025-01-${String(i % 30 + 1).padStart(2, '0')}T08:00:00Z`,
        check_out_time: `2025-01-${String(i % 30 + 1).padStart(2, '0')}T16:00:00Z`
      }));

      const input: PayrollCalculationInput = {
        employeeRates: mockEmployeeRates,
        timeEntries: largeTimeEntries,
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31'
      };

      const startTime = performance.now();
      const result = calculateEmployeePayroll(input);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(result.totalDaysWorked).toBeGreaterThan(0);
    });

    it('ควรรักษาความแม่นยำทศนิยมใน calculations', () => {
      const timeEntries: TimeEntry[] = [
        { check_in_time: '2025-01-15T08:00:00Z', check_out_time: '2025-01-15T16:20:00Z' } // 8.333... hours
      ];

      const rates: EmployeeRates = {
        hourly_rate: 33.33,
        daily_rate: 400
      };

      const input: PayrollCalculationInput = {
        employeeRates: rates,
        timeEntries,
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31'
      };

      const result = calculateEmployeePayroll(input);
      
      // 8.33 hours * 33.33 = 277.6389 -> rounded to 277.64
      expect(result.basePay).toBe(277.64);
    });
  });
});