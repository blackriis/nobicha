import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis()
}

// Mock the createClient function
vi.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  authRateLimiter: {
    checkLimit: vi.fn().mockResolvedValue({ allowed: true })
  }
}))

// Mock validation
vi.mock('@/lib/validation', () => ({
  validateRequestBody: vi.fn((body, fields) => ({
    valid: fields.every(field => body[field] !== undefined && body[field] !== null && body[field] !== ''),
    errors: fields.filter(field => !body[field]).map(field => `${field} is required`)
  }))
}))

// Import handlers after mocking
import { GET, POST } from '@/app/api/admin/raw-materials/route'
import { PUT, DELETE } from '@/app/api/admin/raw-materials/[id]/route'

describe('/api/admin/raw-materials API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/admin/raw-materials', () => {
    it('should return raw materials list for admin user', async () => {
      // Mock admin user authentication
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      const mockRawMaterials = [
        {
          id: '1',
          name: 'น้ำมันพืช',
          unit: 'ลิตร',
          cost_per_unit: 25.50,
          created_at: '2025-01-01T00:00:00Z'
        }
      ]

      // Mock the main query chain
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockRawMaterials,
          count: 1,
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue(mockQuery)
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      const request = new Request('https://example.com/api/admin/raw-materials?page=1&limit=20')
      const response = await GET(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockRawMaterials)
      expect(result.pagination.total).toBe(1)
    })

    it('should return 403 for non-admin user', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'employee-user-id' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'employee' },
              error: null
            })
          })
        })
      })

      const request = new Request('https://example.com/api/admin/raw-materials')
      const response = await GET(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('ต้องมีสิทธิ์ admin เท่านั้น')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new Request('https://example.com/api/admin/raw-materials')
      const response = await GET(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ')
    })
  })

  describe('POST /api/admin/raw-materials', () => {
    it('should create new raw material for admin user', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      // Mock duplicate check - no existing material
      const duplicateQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      }

      // Mock insert operation
      const insertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'new-material-id',
                name: 'น้ำมันพืช',
                unit: 'ลิตร',
                cost_per_unit: 25.50,
                created_at: '2025-01-01T00:00:00Z'
              },
              error: null
            })
          })
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({ // For admin role check
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce(duplicateQuery) // For duplicate check
        .mockReturnValueOnce(insertQuery) // For insert

      const request = new Request('https://example.com/api/admin/raw-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'น้ำมันพืช',
          unit: 'ลิตร',
          cost_price: 25.50
        })
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('น้ำมันพืช')
    })

    it('should return 409 for duplicate material name', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      // Mock duplicate check - existing material found
      const duplicateQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-id' },
              error: null
            })
          })
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({ // For admin role check
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce(duplicateQuery) // For duplicate check

      const request = new Request('https://example.com/api/admin/raw-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'น้ำมันพืช',
          unit: 'ลิตร',
          cost_price: 25.50
        })
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('ชื่อวัตถุดิบนี้มีในระบบแล้ว กรุณาเลือกชื่ออื่น')
    })

    it('should return 400 for invalid data', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      const request = new Request('https://example.com/api/admin/raw-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Invalid empty name
          unit: 'ลิตร',
          cost_price: -5 // Invalid negative price
        })
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('ข้อมูลไม่ครบถ้วน')
    })
  })

  describe('PUT /api/admin/raw-materials/[id]', () => {
    it('should update existing raw material', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      // Mock role check
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      // Mock existing material check
      const existingMaterialQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'material-id', name: 'Old Name' },
              error: null
            })
          })
        })
      }

      // Mock duplicate name check (no conflicts)
      const duplicateQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        })
      }

      // Mock update operation
      const updateQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'material-id',
                  name: 'Updated Name',
                  unit: 'ลิตร',
                  cost_per_unit: 30.00,
                  created_at: '2025-01-01T00:00:00Z'
                },
                error: null
              })
            })
          })
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({ // Role check
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce(existingMaterialQuery) // Existing material check
        .mockReturnValueOnce(duplicateQuery) // Duplicate check
        .mockReturnValueOnce(updateQuery) // Update operation

      const request = new Request('https://example.com/api/admin/raw-materials/material-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Name',
          unit: 'ลิตร',
          cost_price: 30.00
        })
      })

      const response = await PUT(request as NextRequest, { params: { id: 'material-id' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Name')
    })

    it('should return 404 for non-existent material', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      // Mock material not found
      const notFoundQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found')
            })
          })
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce(notFoundQuery)

      const request = new Request('https://example.com/api/admin/raw-materials/non-existent-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Name',
          unit: 'ลิตร',
          cost_price: 30.00
        })
      })

      const response = await PUT(request as NextRequest, { params: { id: 'non-existent-id' } })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('ไม่พบวัตถุดิบที่ต้องการแก้ไข')
    })
  })

  describe('DELETE /api/admin/raw-materials/[id]', () => {
    it('should delete raw material when not in use', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      // Mock existing material check
      const existingMaterialQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'material-id', name: 'Test Material' },
              error: null
            })
          })
        })
      }

      // Mock usage check - no usage found
      const usageQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      }

      // Mock delete operation
      const deleteQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce(existingMaterialQuery)
        .mockReturnValueOnce(usageQuery)
        .mockReturnValueOnce(deleteQuery)

      const request = new Request('https://example.com/api/admin/raw-materials/material-id', {
        method: 'DELETE'
      })

      const response = await DELETE(request as NextRequest, { params: { id: 'material-id' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('ลบวัตถุดิบเรียบร้อยแล้ว')
    })

    it('should return 409 when material is in use', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      // Mock existing material check
      const existingMaterialQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'material-id', name: 'Test Material' },
              error: null
            })
          })
        })
      }

      // Mock usage check - material is in use
      const usageQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 'usage-id' }],
              error: null
            })
          })
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce(existingMaterialQuery)
        .mockReturnValueOnce(usageQuery)

      const request = new Request('https://example.com/api/admin/raw-materials/material-id', {
        method: 'DELETE'
      })

      const response = await DELETE(request as NextRequest, { params: { id: 'material-id' } })
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('ไม่สามารถลบวัตถุดิบนี้ได้ เนื่องจากมีการใช้งานในระบบ')
    })
  })
})