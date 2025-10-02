import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { materialUsageService } from '@/lib/services/material-usage.service'

// Mock fetch
global.fetch = vi.fn()

describe('MaterialUsageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getAvailableRawMaterials', () => {
    it('should fetch available raw materials successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'material-1',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50,
            created_at: '2025-01-01T00:00:00Z'
          },
          {
            id: 'material-2',
            name: 'เกลือ',
            unit: 'กิโลกรัม',
            cost_per_unit: 15.00,
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await materialUsageService.getAvailableRawMaterials()

      expect(fetch).toHaveBeenCalledWith('/api/employee/raw-materials', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0].name).toBe('น้ำมันพืช')
    })

    it('should handle API error response', async () => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'ไม่ได้รับอนุญาต'
        })
      })

      const result = await materialUsageService.getAvailableRawMaterials()

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่ได้รับอนุญาต')
    })

    it('should handle network error', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await materialUsageService.getAvailableRawMaterials()

      expect(result.success).toBe(false)
      expect(result.error).toBe('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    })
  })

  describe('getCurrentSessionUsage', () => {
    it('should fetch current session usage successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          has_active_session: true,
          time_entry_id: 'time-entry-1',
          records: [
            {
              id: 'usage-1',
              time_entry_id: 'time-entry-1',
              material_id: 'material-1',
              quantity_used: 2.5,
              created_at: '2025-01-01T10:00:00Z',
              raw_materials: {
                id: 'material-1',
                name: 'น้ำมันพืช',
                unit: 'ลิตร',
                cost_per_unit: 25.50
              }
            }
          ],
          total_cost: 63.75,
          can_add_materials: true
        }
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await materialUsageService.getCurrentSessionUsage()

      expect(fetch).toHaveBeenCalledWith('/api/employee/material-usage/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(result.success).toBe(true)
      expect(result.data?.has_active_session).toBe(true)
      expect(result.data?.records).toHaveLength(1)
      expect(result.data?.total_cost).toBe(63.75)
    })

    it('should handle no active session', async () => {
      const mockResponse = {
        success: true,
        data: {
          has_active_session: false,
          message: 'ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์'
        }
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await materialUsageService.getCurrentSessionUsage()

      expect(result.success).toBe(true)
      expect(result.data?.has_active_session).toBe(false)
      expect(result.data?.message).toBe('ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์')
    })
  })

  describe('submitMaterialUsage', () => {
    it('should submit material usage successfully', async () => {
      const mockInput = {
        materials: [
          {
            material_id: 'material-1',
            quantity_used: 2.5
          },
          {
            material_id: 'material-2',
            quantity_used: 1.0
          }
        ]
      }

      const mockResponse = {
        success: true,
        data: {
          records: [
            {
              id: 'usage-1',
              time_entry_id: 'time-entry-1',
              material_id: 'material-1',
              quantity_used: 2.5,
              created_at: '2025-01-01T10:00:00Z',
              raw_materials: {
                id: 'material-1',
                name: 'น้ำมันพืช',
                unit: 'ลิตร',
                cost_per_unit: 25.50
              }
            }
          ],
          total_cost: 63.75,
          time_entry_id: 'time-entry-1'
        }
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await materialUsageService.submitMaterialUsage(mockInput)

      expect(fetch).toHaveBeenCalledWith('/api/employee/material-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockInput)
      })
      expect(result.success).toBe(true)
      expect(result.data?.records).toHaveLength(1)
      expect(result.data?.total_cost).toBe(63.75)
    })

    it('should validate input before submission', async () => {
      const invalidInput = {
        materials: [] // Empty materials array
      }

      const result = await materialUsageService.submitMaterialUsage(invalidInput)

      expect(result.success).toBe(false)
      expect(result.error).toBe('กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should validate material quantities', async () => {
      const invalidInput = {
        materials: [
          {
            material_id: 'material-1',
            quantity_used: -1 // Invalid negative quantity
          }
        ]
      }

      const result = await materialUsageService.submitMaterialUsage(invalidInput)

      expect(result.success).toBe(false)
      expect(result.error).toBe('วัตถุดิบลำดับที่ 1: จำนวนต้องเป็นตัวเลขบวกเท่านั้น')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should validate duplicate materials', async () => {
      const invalidInput = {
        materials: [
          {
            material_id: 'material-1',
            quantity_used: 1.0
          },
          {
            material_id: 'material-1', // Duplicate
            quantity_used: 2.0
          }
        ]
      }

      const result = await materialUsageService.submitMaterialUsage(invalidInput)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่สามารถเลือกวัตถุดิบซ้ำได้')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should validate decimal places', async () => {
      const invalidInput = {
        materials: [
          {
            material_id: 'material-1',
            quantity_used: 1.123 // Too many decimal places
          }
        ]
      }

      const result = await materialUsageService.submitMaterialUsage(invalidInput)

      expect(result.success).toBe(false)
      expect(result.error).toBe('วัตถุดิบลำดับที่ 1: จำนวนสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง')
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('calculateTotalCost', () => {
    it('should calculate total cost correctly', () => {
      const records = [
        {
          id: 'usage-1',
          time_entry_id: 'time-entry-1',
          material_id: 'material-1',
          quantity_used: 2.5,
          created_at: '2025-01-01T10:00:00Z',
          raw_materials: {
            id: 'material-1',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50
          }
        },
        {
          id: 'usage-2',
          time_entry_id: 'time-entry-1',
          material_id: 'material-2',
          quantity_used: 1.0,
          created_at: '2025-01-01T10:05:00Z',
          raw_materials: {
            id: 'material-2',
            name: 'เกลือ',
            unit: 'กิโลกรัม',
            cost_per_unit: 15.00
          }
        }
      ]

      const totalCost = materialUsageService.calculateTotalCost(records, 'admin')

      expect(totalCost).toBe(78.75) // (2.5 * 25.50) + (1.0 * 15.00)
    })

    it('should return 0 for empty records', () => {
      const totalCost = materialUsageService.calculateTotalCost([])
      expect(totalCost).toBe(0)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency in Thai locale', () => {
      const formatted = materialUsageService.formatCurrency(1234.56)
      expect(formatted).toBe('฿1,234.56')
    })

    it('should handle zero amount', () => {
      const formatted = materialUsageService.formatCurrency(0)
      expect(formatted).toBe('฿0.00')
    })
  })

  describe('formatDate', () => {
    it('should format date in Thai locale', () => {
      const formatted = materialUsageService.formatDate('2025-01-01T10:30:00Z')
      expect(formatted).toContain('2568') // Buddhist year
      expect(formatted).toContain('มกราคม')
    })
  })

  describe('formatDateShort', () => {
    it('should format date in short Thai format', () => {
      const formatted = materialUsageService.formatDateShort('2025-01-01T10:30:00Z')
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })
})