import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rawMaterialsService } from '@/lib/services/raw-materials.service'

// Mock fetch
global.fetch = vi.fn()

describe('RawMaterialsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getRawMaterials', () => {
    it('should fetch raw materials with default parameters', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            name: 'น้ำมันพืช',
            unit: 'ลิตร',
            cost_per_unit: 25.50,
            created_at: '2025-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await rawMaterialsService.getRawMaterials()

      expect(fetch).toHaveBeenCalledWith('/api/admin/raw-materials?', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(result.success).toBe(true)
      expect(result.data?.data).toHaveLength(1)
      expect(result.data?.data[0].name).toBe('น้ำมันพืช')
    })

    it('should fetch raw materials with search and sort parameters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      await rawMaterialsService.getRawMaterials({
        page: 1,
        limit: 10,
        search: 'น้ำมัน',
        sortBy: 'cost_per_unit',
        sortOrder: 'desc'
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/raw-materials?page=1&limit=10&search=น้ำมัน&sortBy=cost_per_unit&sortOrder=desc',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    })

    it('should handle fetch error gracefully', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await rawMaterialsService.getRawMaterials()

      expect(result.success).toBe(false)
      expect(result.error).toBe('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    })

    it('should handle API error response', async () => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Unauthorized'
        })
      })

      const result = await rawMaterialsService.getRawMaterials()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('createRawMaterial', () => {
    it('should create raw material successfully', async () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: 25.50
      }

      const mockResponse = {
        success: true,
        data: {
          id: 'new-id',
          ...input,
          cost_per_unit: 25.50,
          created_at: '2025-01-01T00:00:00Z'
        }
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await rawMaterialsService.createRawMaterial(input)

      expect(fetch).toHaveBeenCalledWith('/api/admin/raw-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      })
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('น้ำมันพืช')
    })

    it('should validate input before making request', async () => {
      const invalidInput = {
        name: '', // Invalid empty name
        unit: 'ลิตร',
        cost_price: -5 // Invalid negative price
      }

      const result = await rawMaterialsService.createRawMaterial(invalidInput)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ชื่อวัตถุดิบต้องมีความยาว 1-100 ตัวอักษร')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle duplicate name error', async () => {
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: 25.50
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'ชื่อวัตถุดิบนี้มีในระบบแล้ว กรุณาเลือกชื่ออื่น'
        })
      })

      const result = await rawMaterialsService.createRawMaterial(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ชื่อวัตถุดิบนี้มีในระบบแล้ว กรุณาเลือกชื่ออื่น')
    })
  })

  describe('updateRawMaterial', () => {
    it('should update raw material successfully', async () => {
      const id = 'material-id'
      const input = {
        name: 'น้ำมันพืช (แก้ไข)',
        unit: 'ลิตร',
        cost_price: 30.00
      }

      const mockResponse = {
        success: true,
        data: {
          id,
          ...input,
          cost_per_unit: 30.00,
          created_at: '2025-01-01T00:00:00Z'
        }
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await rawMaterialsService.updateRawMaterial(id, input)

      expect(fetch).toHaveBeenCalledWith(`/api/admin/raw-materials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      })
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('น้ำมันพืช (แก้ไข)')
    })

    it('should handle not found error', async () => {
      const id = 'non-existent-id'
      const input = {
        name: 'น้ำมันพืช',
        unit: 'ลิตร',
        cost_price: 25.50
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'ไม่พบวัตถุดิบที่ต้องการแก้ไข'
        })
      })

      const result = await rawMaterialsService.updateRawMaterial(id, input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่พบวัตถุดิบที่ต้องการแก้ไข')
    })
  })

  describe('deleteRawMaterial', () => {
    it('should delete raw material successfully', async () => {
      const id = 'material-id'

      const mockResponse = {
        success: true,
        message: 'ลบวัตถุดิบเรียบร้อยแล้ว'
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await rawMaterialsService.deleteRawMaterial(id)

      expect(fetch).toHaveBeenCalledWith(`/api/admin/raw-materials/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(result.success).toBe(true)
    })

    it('should handle material in use error', async () => {
      const id = 'material-id'

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'ไม่สามารถลบวัตถุดิบนี้ได้ เนื่องจากมีการใช้งานในระบบ'
        })
      })

      const result = await rawMaterialsService.deleteRawMaterial(id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ไม่สามารถลบวัตถุดิบนี้ได้ เนื่องจากมีการใช้งานในระบบ')
    })
  })

  describe('utility methods', () => {
    it('should format currency correctly', () => {
      expect(rawMaterialsService.formatCurrency(25.50)).toBe('฿25.50')
      expect(rawMaterialsService.formatCurrency(1000)).toBe('฿1,000.00')
      expect(rawMaterialsService.formatCurrency(0.99)).toBe('฿0.99')
    })

    it('should format date correctly', () => {
      const dateString = '2025-01-01T10:30:00Z'
      const formatted = rawMaterialsService.formatDate(dateString)
      
      // Just check that it returns a string (actual format depends on locale)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })
})