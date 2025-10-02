import { describe, it, expect, beforeEach, vi } from 'vitest'
import { materialUsageService } from '@/lib/services/material-usage.service'
import type { MaterialUsageInput } from '@/lib/services/material-usage.service'

// Mock fetch globally for service tests
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Material Usage Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Service Integration', () => {
    it('should handle successful API response', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'material-1',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50,
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await materialUsageService.getAvailableRawMaterials()

      expect(mockFetch).toHaveBeenCalledWith('/api/employee/raw-materials', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].name).toBe('น้ำมันพืช')
    })

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'ไม่ได้รับอนุญาต'
        })
      })

      const result = await materialUsageService.getAvailableRawMaterials()

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่ได้รับอนุญาต')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await materialUsageService.getAvailableRawMaterials()

      expect(result.success).toBe(false)
      expect(result.error).toBe('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    })
  })

  describe('Session Management', () => {
    it('should fetch current session successfully', async () => {
      const mockSessionData = {
        success: true,
        data: {
          has_active_session: true,
          time_entry_id: 'time-entry-1',
          records: [],
          total_cost: 0,
          can_add_materials: true
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData
      })

      const result = await materialUsageService.getCurrentSessionUsage()

      expect(mockFetch).toHaveBeenCalledWith('/api/employee/material-usage/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      expect(result.success).toBe(true)
      expect(result.data?.has_active_session).toBe(true)
    })

    it('should handle no active session', async () => {
      const mockSessionData = {
        success: true,
        data: {
          has_active_session: false,
          message: 'ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData
      })

      const result = await materialUsageService.getCurrentSessionUsage()

      expect(result.success).toBe(true)
      expect(result.data?.has_active_session).toBe(false)
      expect(result.data?.message).toContain('ไม่พบการเช็คอิน')
    })
  })

  describe('Material Submission', () => {
    it('should submit materials successfully', async () => {
      const input: MaterialUsageInput = {
        materials: [
          {
            material_id: 'material-1',
            quantity_used: 2.5
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await materialUsageService.submitMaterialUsage(input)

      expect(mockFetch).toHaveBeenCalledWith('/api/employee/material-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
      })
      expect(result.success).toBe(true)
      expect(result.data?.records).toHaveLength(1)
    })

    it('should validate input before API call', async () => {
      const invalidInput: MaterialUsageInput = {
        materials: [] // Empty array should be rejected
      }

      const result = await materialUsageService.submitMaterialUsage(invalidInput)

      expect(result.success).toBe(false)
      expect(result.error).toBe('กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate material quantities', async () => {
      const invalidInput: MaterialUsageInput = {
        materials: [
          {
            material_id: 'material-1',
            quantity_used: -1 // Invalid negative quantity
          }
        ]
      }

      const result = await materialUsageService.submitMaterialUsage(invalidInput)

      expect(result.success).toBe(false)
      expect(result.error).toContain('จำนวนต้องเป็นตัวเลขบวกเท่านั้น')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should check for duplicate materials', async () => {
      const invalidInput: MaterialUsageInput = {
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
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Utility Functions', () => {
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
        }
      ]

      // Admin should see cost
      const adminCost = materialUsageService.calculateTotalCost(records, 'admin')
      expect(adminCost).toBe(63.75)

      // Employee should not see cost
      const employeeCost = materialUsageService.calculateTotalCost(records, 'employee')
      expect(employeeCost).toBe(0)
    })

    it('should format currency correctly', () => {
      expect(materialUsageService.formatCurrency(1234.56)).toBe('฿1,234.56')
      expect(materialUsageService.formatCurrency(0)).toBe('฿0.00')
    })

    it('should handle invalid amounts gracefully', () => {
      expect(materialUsageService.formatCurrency(NaN)).toBe('฿0.00')
      expect(materialUsageService.formatCurrency(null as any)).toBe('฿0.00')
    })

    it('should format dates in Thai locale', () => {
      const dateStr = '2025-01-01T10:30:00Z'
      const formatted = materialUsageService.formatDate(dateStr)
      
      // Should contain Thai month and Buddhist year
      expect(formatted).toContain('มกราคม')
      expect(formatted).toContain('2568') // Buddhist year
    })

    it('should format short dates correctly', () => {
      const dateStr = '2025-01-01T10:30:00Z'
      const formatted = materialUsageService.formatDateShort(dateStr)
      
      // Should be in DD/MM/YYYY format
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      const result = await materialUsageService.getAvailableRawMaterials()

      expect(result.success).toBe(false)
      expect(result.error).toBe('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    })

    it('should handle fetch timeout/abort', async () => {
      mockFetch.mockRejectedValueOnce(new Error('The operation was aborted'))

      const result = await materialUsageService.getCurrentSessionUsage()

      expect(result.success).toBe(false)
      expect(result.error).toBe('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    })

    it('should handle server errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error'
        })
      })

      const result = await materialUsageService.submitMaterialUsage({
        materials: [
          {
            material_id: 'material-1',
            quantity_used: 1.0
          }
        ]
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Internal server error')
    })
  })
})