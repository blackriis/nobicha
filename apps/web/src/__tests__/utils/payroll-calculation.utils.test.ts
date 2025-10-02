import { describe, it, expect } from 'vitest'
import {
  calculateHoursWorked,
  groupTimeEntriesByDate,
  calculateDayPay,
  calculateEmployeePayroll,
  isDateRangeOverlapping,
  formatDateForInput,
  generatePayrollCycleName,
  validateDateRange
} from '@/features/payroll/utils/payroll-calculation.utils'
import type { TimeEntry, EmployeeRates } from '@/features/payroll/utils/payroll-calculation.utils'

describe('payroll-calculation.utils', () => {
  describe('calculateHoursWorked', () => {
    it('should calculate correct hours for same day work', () => {
      const checkIn = '2025-01-07T09:00:00Z'
      const checkOut = '2025-01-07T17:00:00Z'
      
      const hours = calculateHoursWorked(checkIn, checkOut)
      expect(hours).toBe(8)
    })

    it('should handle overtime work (more than 8 hours)', () => {
      const checkIn = '2025-01-07T08:00:00Z'
      const checkOut = '2025-01-07T20:00:00Z'
      
      const hours = calculateHoursWorked(checkIn, checkOut)
      expect(hours).toBe(12)
    })

    it('should handle partial hours', () => {
      const checkIn = '2025-01-07T09:00:00Z'
      const checkOut = '2025-01-07T17:30:00Z'
      
      const hours = calculateHoursWorked(checkIn, checkOut)
      expect(hours).toBe(8.5)
    })

    it('should handle minutes precision', () => {
      const checkIn = '2025-01-07T09:15:00Z'
      const checkOut = '2025-01-07T17:45:00Z'
      
      const hours = calculateHoursWorked(checkIn, checkOut)
      expect(hours).toBe(8.5)
    })

    it('should return 0 for invalid time range (checkout before checkin)', () => {
      const checkIn = '2025-01-07T17:00:00Z'
      const checkOut = '2025-01-07T09:00:00Z'
      
      const hours = calculateHoursWorked(checkIn, checkOut)
      expect(hours).toBe(0)
    })

    it('should return 0 for same time', () => {
      const checkIn = '2025-01-07T09:00:00Z'
      const checkOut = '2025-01-07T09:00:00Z'
      
      const hours = calculateHoursWorked(checkIn, checkOut)
      expect(hours).toBe(0)
    })

    it('should handle invalid date strings gracefully', () => {
      const hours = calculateHoursWorked('invalid-date', '2025-01-07T17:00:00Z')
      expect(hours).toBe(0)
    })
  })

  describe('groupTimeEntriesByDate', () => {
    const timeEntries: TimeEntry[] = [
      { check_in_time: '2025-01-07T09:00:00Z', check_out_time: '2025-01-07T17:00:00Z' },
      { check_in_time: '2025-01-07T18:00:00Z', check_out_time: '2025-01-07T22:00:00Z' },
      { check_in_time: '2025-01-08T09:00:00Z', check_out_time: '2025-01-08T17:00:00Z' },
    ]

    it('should group entries by date correctly', () => {
      const grouped = groupTimeEntriesByDate(timeEntries)
      
      expect(Object.keys(grouped)).toHaveLength(2)
      expect(grouped['2025-01-07']).toHaveLength(2)
      expect(grouped['2025-01-08']).toHaveLength(1)
    })

    it('should handle empty array', () => {
      const grouped = groupTimeEntriesByDate([])
      expect(Object.keys(grouped)).toHaveLength(0)
    })

    it('should handle entries with invalid dates gracefully', () => {
      const entriesWithInvalid: TimeEntry[] = [
        { check_in_time: 'invalid-date', check_out_time: '2025-01-07T17:00:00Z' },
        { check_in_time: '2025-01-07T09:00:00Z', check_out_time: '2025-01-07T17:00:00Z' },
      ]
      
      const grouped = groupTimeEntriesByDate(entriesWithInvalid)
      expect(Object.keys(grouped)).toHaveLength(1)
      expect(grouped['2025-01-07']).toHaveLength(1)
    })
  })

  describe('calculateDayPay', () => {
    const employeeRates: EmployeeRates = {
      hourly_rate: 50,
      daily_rate: 500
    }

    it('should use hourly rate for 8 hours work', () => {
      const dayEntries: TimeEntry[] = [
        { check_in_time: '2025-01-07T09:00:00Z', check_out_time: '2025-01-07T17:00:00Z' }
      ]
      
      const dayPay = calculateDayPay(dayEntries, employeeRates)
      
      expect(dayPay.hours).toBe(8)
      expect(dayPay.method).toBe('hourly')
      expect(dayPay.pay).toBe(400) // 8 * 50
      expect(dayPay.date).toBe('2025-01-07')
    })

    it('should use hourly rate for exactly 12 hours work', () => {
      const dayEntries: TimeEntry[] = [
        { check_in_time: '2025-01-07T08:00:00Z', check_out_time: '2025-01-07T20:00:00Z' }
      ]
      
      const dayPay = calculateDayPay(dayEntries, employeeRates)
      
      expect(dayPay.hours).toBe(12)
      expect(dayPay.method).toBe('hourly')
      expect(dayPay.pay).toBe(600) // 12 * 50
    })

    it('should use daily rate for more than 12 hours work', () => {
      const dayEntries: TimeEntry[] = [
        { check_in_time: '2025-01-07T08:00:00Z', check_out_time: '2025-01-07T21:00:00Z' }
      ]
      
      const dayPay = calculateDayPay(dayEntries, employeeRates)
      
      expect(dayPay.hours).toBe(13)
      expect(dayPay.method).toBe('daily')
      expect(dayPay.pay).toBe(500) // daily rate
    })

    it('should handle multiple time entries in the same day', () => {
      const dayEntries: TimeEntry[] = [
        { check_in_time: '2025-01-07T09:00:00Z', check_out_time: '2025-01-07T12:00:00Z' },
        { check_in_time: '2025-01-07T13:00:00Z', check_out_time: '2025-01-07T17:00:00Z' },
        { check_in_time: '2025-01-07T18:00:00Z', check_out_time: '2025-01-07T24:00:00Z' }
      ]
      
      const dayPay = calculateDayPay(dayEntries, employeeRates)
      
      expect(dayPay.hours).toBe(13) // 3 + 4 + 6 = 13
      expect(dayPay.method).toBe('daily')
      expect(dayPay.pay).toBe(500)
    })

    it('should handle entries with null check_out_time', () => {
      const dayEntries: TimeEntry[] = [
        { check_in_time: '2025-01-07T09:00:00Z', check_out_time: '2025-01-07T17:00:00Z' },
        { check_in_time: '2025-01-07T18:00:00Z', check_out_time: null }
      ]
      
      const dayPay = calculateDayPay(dayEntries, employeeRates)
      
      expect(dayPay.hours).toBe(8) // Only the first entry
      expect(dayPay.method).toBe('hourly')
      expect(dayPay.pay).toBe(400)
    })
  })

  describe('calculateEmployeePayroll', () => {
    const employeeRates: EmployeeRates = {
      hourly_rate: 50,
      daily_rate: 500
    }

    const timeEntries: TimeEntry[] = [
      // Day 1: 8 hours (hourly)
      { check_in_time: '2025-01-07T09:00:00Z', check_out_time: '2025-01-07T17:00:00Z' },
      // Day 2: 13 hours (daily)  
      { check_in_time: '2025-01-08T08:00:00Z', check_out_time: '2025-01-08T21:00:00Z' },
      // Day 3: 10 hours (hourly)
      { check_in_time: '2025-01-09T09:00:00Z', check_out_time: '2025-01-09T19:00:00Z' },
      // Outside period - should be ignored
      { check_in_time: '2025-01-15T09:00:00Z', check_out_time: '2025-01-15T17:00:00Z' }
    ]

    it('should calculate payroll for mixed calculation methods', () => {
      const input = {
        employeeRates,
        timeEntries,
        periodStart: '2025-01-07',
        periodEnd: '2025-01-10'
      }
      
      const result = calculateEmployeePayroll(input)
      
      expect(result.totalDaysWorked).toBe(3)
      expect(result.totalHours).toBe(31) // 8 + 13 + 10
      expect(result.basePay).toBe(1400) // 400 (day1) + 500 (day2) + 500 (day3)
      expect(result.calculationMethod).toBe('mixed')
      expect(result.dailyBreakdown).toHaveLength(3)
      
      // Check individual days
      expect(result.dailyBreakdown[0].method).toBe('hourly')
      expect(result.dailyBreakdown[1].method).toBe('daily')
      expect(result.dailyBreakdown[2].method).toBe('hourly')
    })

    it('should calculate payroll for all hourly work', () => {
      const hourlyEntries: TimeEntry[] = [
        { check_in_time: '2025-01-07T09:00:00Z', check_out_time: '2025-01-07T17:00:00Z' }, // 8 hours
        { check_in_time: '2025-01-08T09:00:00Z', check_out_time: '2025-01-08T17:00:00Z' }, // 8 hours
      ]

      const input = {
        employeeRates,
        timeEntries: hourlyEntries,
        periodStart: '2025-01-07',
        periodEnd: '2025-01-08'
      }
      
      const result = calculateEmployeePayroll(input)
      
      expect(result.calculationMethod).toBe('hourly')
      expect(result.totalHours).toBe(16)
      expect(result.basePay).toBe(800) // 16 * 50
    })

    it('should calculate payroll for all daily work', () => {
      const dailyEntries: TimeEntry[] = [
        { check_in_time: '2025-01-07T08:00:00Z', check_out_time: '2025-01-07T21:00:00Z' }, // 13 hours
        { check_in_time: '2025-01-08T08:00:00Z', check_out_time: '2025-01-08T22:00:00Z' }, // 14 hours
      ]

      const input = {
        employeeRates,
        timeEntries: dailyEntries,
        periodStart: '2025-01-07',
        periodEnd: '2025-01-08'
      }
      
      const result = calculateEmployeePayroll(input)
      
      expect(result.calculationMethod).toBe('daily')
      expect(result.totalHours).toBe(27)
      expect(result.basePay).toBe(1000) // 2 * 500
    })

    it('should handle empty time entries', () => {
      const input = {
        employeeRates,
        timeEntries: [],
        periodStart: '2025-01-07',
        periodEnd: '2025-01-10'
      }
      
      const result = calculateEmployeePayroll(input)
      
      expect(result.totalDaysWorked).toBe(0)
      expect(result.totalHours).toBe(0)
      expect(result.basePay).toBe(0)
      expect(result.calculationMethod).toBe('hourly')
      expect(result.dailyBreakdown).toHaveLength(0)
    })

    it('should filter entries outside period', () => {
      const input = {
        employeeRates,
        timeEntries: [
          // Before period
          { check_in_time: '2025-01-06T09:00:00Z', check_out_time: '2025-01-06T17:00:00Z' },
          // In period
          { check_in_time: '2025-01-07T09:00:00Z', check_out_time: '2025-01-07T17:00:00Z' },
          // After period
          { check_in_time: '2025-01-11T09:00:00Z', check_out_time: '2025-01-11T17:00:00Z' }
        ],
        periodStart: '2025-01-07',
        periodEnd: '2025-01-10'
      }
      
      const result = calculateEmployeePayroll(input)
      
      expect(result.totalDaysWorked).toBe(1)
      expect(result.dailyBreakdown).toHaveLength(1)
      expect(result.dailyBreakdown[0].date).toBe('2025-01-07')
    })

    it('should ignore entries without check_out_time', () => {
      const entriesWithIncomplete: TimeEntry[] = [
        { check_in_time: '2025-01-07T09:00:00Z', check_out_time: '2025-01-07T17:00:00Z' },
        { check_in_time: '2025-01-08T09:00:00Z', check_out_time: null }
      ]

      const input = {
        employeeRates,
        timeEntries: entriesWithIncomplete,
        periodStart: '2025-01-07',
        periodEnd: '2025-01-10'
      }
      
      const result = calculateEmployeePayroll(input)
      
      expect(result.totalDaysWorked).toBe(1) // Only complete entries
    })
  })

  describe('isDateRangeOverlapping', () => {
    it('should detect overlapping ranges', () => {
      expect(isDateRangeOverlapping(
        '2025-01-01', '2025-01-15',
        '2025-01-10', '2025-01-25'
      )).toBe(true)
    })

    it('should detect touching ranges as overlapping', () => {
      expect(isDateRangeOverlapping(
        '2025-01-01', '2025-01-15',
        '2025-01-15', '2025-01-25'
      )).toBe(true)
    })

    it('should detect non-overlapping ranges', () => {
      expect(isDateRangeOverlapping(
        '2025-01-01', '2025-01-15',
        '2025-01-16', '2025-01-25'
      )).toBe(false)
    })

    it('should handle complete containment', () => {
      expect(isDateRangeOverlapping(
        '2025-01-01', '2025-01-31',
        '2025-01-10', '2025-01-20'
      )).toBe(true)
    })

    it('should handle invalid dates gracefully', () => {
      expect(isDateRangeOverlapping(
        'invalid-date', '2025-01-15',
        '2025-01-10', '2025-01-25'
      )).toBe(false)
    })
  })

  describe('formatDateForInput', () => {
    it('should format Date object to YYYY-MM-DD', () => {
      const date = new Date('2025-01-07T00:00:00Z')
      const formatted = formatDateForInput(date)
      expect(formatted).toBe('2025-01-07')
    })

    it('should format date string to YYYY-MM-DD', () => {
      const formatted = formatDateForInput('2025-01-07T15:30:00Z')
      expect(formatted).toBe('2025-01-07')
    })

    it('should handle invalid date gracefully', () => {
      const formatted = formatDateForInput('invalid-date')
      expect(formatted).toBe('')
    })
  })

  describe('generatePayrollCycleName', () => {
    it('should generate name for same month period', () => {
      const name = generatePayrollCycleName('2025-01-01', '2025-01-31')
      expect(name).toContain('เงินเดือน')
      expect(name).toContain('2568') // Buddhist year
    })

    it('should generate name for cross-month period', () => {
      const name = generatePayrollCycleName('2025-01-15', '2025-02-15')
      expect(name).toContain('เงินเดือน')
      expect(name).toContain('-')
    })

    it('should handle invalid dates gracefully', () => {
      const name = generatePayrollCycleName('invalid-start', 'invalid-end')
      expect(name).toBe('เงินเดือน invalid-start - invalid-end')
    })
  })

  describe('validateDateRange', () => {
    it('should validate correct date range', () => {
      const result = validateDateRange('2025-01-01', '2025-01-31')
      expect(result.isValid).toBe(true)
    })

    it('should reject missing dates', () => {
      const result = validateDateRange('', '2025-01-31')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('กรุณาระบุวันที่เริ่มต้นและสิ้นสุด')
    })

    it('should reject invalid date format', () => {
      const result = validateDateRange('invalid-date', '2025-01-31')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('รูปแบบวันที่ไม่ถูกต้อง')
    })

    it('should reject start date >= end date', () => {
      const result = validateDateRange('2025-01-31', '2025-01-01')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด')
    })

    it('should reject period longer than 1 year', () => {
      const result = validateDateRange('2025-01-01', '2026-01-02')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('ช่วงรอบการจ่ายเงินเดือนไม่ควรเกิน 1 ปี')
    })

    it('should reject end date too far in future', () => {
      const futureYear = new Date().getFullYear() + 1
      const result = validateDateRange('2025-01-01', `${futureYear}-01-02`) // More than 1 year
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('ช่วงรอบการจ่ายเงินเดือนไม่ควรเกิน 1 ปี')
    })
  })
})