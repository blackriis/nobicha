import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { timeEntryService } from '@/lib/services/time-entry.service'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createSupabaseClientSide: vi.fn(() => ({}))
}))

// Mock other dependencies
vi.mock('@/lib/services/location.service', () => ({
  locationService: {}
}))

vi.mock('@/lib/services/upload.service', () => ({
  uploadService: {}
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('TimeEntryService - Work History Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getTimeEntryHistory', () => {
    it('should fetch time entry history successfully', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            id: 'entry-1',
            user_id: 'user-123',
            branch_id: 'branch-1',
            check_in_time: '2024-01-17T08:00:00Z',
            check_out_time: '2024-01-17T17:00:00Z',
            total_hours: 8,
            branch: {
              id: 'branch-1',
              name: 'สาขาทดสอบ',
              latitude: 13.7563,
              longitude: 100.5018
            }
          }
        ],
        dateRange: 'today',
        totalCount: 1
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData
      })

      const result = await timeEntryService.getTimeEntryHistory('today')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/employee/time-entries/history?dateRange=today',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.dateRange).toBe('today')
      expect(result.totalCount).toBe(1)
    })

    it('should handle API error response', async () => {
      const mockError = { error: 'Database connection failed' }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockError
      })

      const result = await timeEntryService.getTimeEntryHistory('today')

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await timeEntryService.getTimeEntryHistory('week')

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.error).toBe('เกิดข้อผิดพลาดในการดึงประวัติการทำงาน')
    })

    it('should default to today when no dateRange provided', async () => {
      const mockResponseData = {
        success: true,
        data: [],
        dateRange: 'today',
        totalCount: 0
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData
      })

      const result = await timeEntryService.getTimeEntryHistory()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/employee/time-entries/history?dateRange=today',
        expect.any(Object)
      )

      expect(result.dateRange).toBe('today')
    })
  })

  describe('getDateRangeLabel', () => {
    it('should return correct Thai labels', () => {
      expect(timeEntryService.getDateRangeLabel('today')).toBe('วันนี้')
      expect(timeEntryService.getDateRangeLabel('week')).toBe('7 วันที่ผ่านมา')
      expect(timeEntryService.getDateRangeLabel('month')).toBe('30 วันที่ผ่านมา')
    })

    it('should default to today for invalid range', () => {
      // @ts-expect-error Testing invalid input
      expect(timeEntryService.getDateRangeLabel('invalid')).toBe('วันนี้')
    })
  })

  describe('formatDateForDisplay', () => {
    it('should format date in Thai Buddhist Era', () => {
      const testDate = '2024-01-17T08:00:00Z'
      const result = timeEntryService.formatDateForDisplay(testDate)
      
      expect(result).toBe('17 มกราคม 2567') // 2024 + 543 = 2567
    })

    it('should handle different months', () => {
      expect(timeEntryService.formatDateForDisplay('2024-02-15T10:00:00Z')).toBe('15 กุมภาพันธ์ 2567')
      expect(timeEntryService.formatDateForDisplay('2024-12-31T12:00:00Z')).toBe('31 ธันวาคม 2567')
    })
  })

  describe('formatTimeForDisplay', () => {
    it('should format time in 24-hour format', () => {
      expect(timeEntryService.formatTimeForDisplay('2024-01-17T08:30:00Z')).toBe('15:30') // UTC+7
      expect(timeEntryService.formatTimeForDisplay('2024-01-17T13:45:00Z')).toBe('20:45') // UTC+7
    })

    it('should pad single digits with zero', () => {
      expect(timeEntryService.formatTimeForDisplay('2024-01-17T01:05:00Z')).toBe('08:05') // UTC+7
    })
  })

  describe('getWorkStatus', () => {
    it('should return กำลังทำงาน when no check_out_time', () => {
      expect(timeEntryService.getWorkStatus(undefined)).toBe('กำลังทำงาน')
      expect(timeEntryService.getWorkStatus(null as any)).toBe('กำลังทำงาน')
    })

    it('should return เสร็จสิ้น when check_out_time exists', () => {
      expect(timeEntryService.getWorkStatus('2024-01-17T17:00:00Z')).toBe('เสร็จสิ้น')
    })
  })
})