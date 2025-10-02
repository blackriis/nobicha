import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/employee/raw-materials/route'
import { POST } from '@/app/api/employee/material-usage/route'
import { GET as GetCurrent } from '@/app/api/employee/material-usage/current/route'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis()
}

vi.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase
}))

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  authRateLimiter: {
    checkLimit: vi.fn(() => Promise.resolve({ allowed: true }))
  }
}))

// Mock validation
vi.mock('@/lib/validation', () => ({
  validateRequestBody: vi.fn(() => ({ valid: true, errors: [] }))
}))

describe('Employee Material Usage API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default auth setup
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'employee-user-id' } },
      error: null
    })
    
    // Default user profile
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        mockSupabase.select.mockResolvedValue({
          data: { role: 'employee' },
          error: null
        })
      }
      return mockSupabase
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/employee/raw-materials', () => {
    it('should return available raw materials for authenticated employee', async () => {
      const mockMaterials = [
        {
          id: 'material-1',
          name: 'น้ำมันพืช',
          unit: 'ลิตร',
          cost_per_unit: 25.50
        },
        {
          id: 'material-2',
          name: 'เกลือ',
          unit: 'กิโลกรัม',
          cost_per_unit: 15.00
        }
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: { role: 'employee' },
              error: null
            })
          }
        }
        if (table === 'raw_materials') {
          return {
            ...mockSupabase,
            order: vi.fn().mockResolvedValue({
              data: mockMaterials,
              error: null
            })
          }
        }
        return mockSupabase
      })

      const request = new NextRequest('https://example.com/api/employee/raw-materials')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockMaterials)
    })

    it('should return 403 for non-employee user', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }
        }
        return mockSupabase
      })

      const request = new NextRequest('https://example.com/api/employee/raw-materials')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('ต้องมีสิทธิ์พนักงานเท่านั้น')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('https://example.com/api/employee/raw-materials')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ')
    })
  })

  describe('GET /api/employee/material-usage/current', () => {
    it('should return current session data with active time entry', async () => {
      const mockTimeEntry = { id: 'time-entry-1' }
      const mockUsageRecords = [
        {
          id: 'usage-1',
          time_entry_id: 'time-entry-1',
          raw_material_id: 'material-1',
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

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: { role: 'employee' },
              error: null
            })
          }
        }
        if (table === 'time_entries') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: mockTimeEntry,
              error: null
            })
          }
        }
        if (table === 'material_usage') {
          return {
            ...mockSupabase,
            order: vi.fn().mockResolvedValue({
              data: mockUsageRecords,
              error: null
            })
          }
        }
        return mockSupabase
      })

      const request = new NextRequest('https://example.com/api/employee/material-usage/current')
      const response = await GetCurrent(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.has_active_session).toBe(true)
      expect(data.data.time_entry_id).toBe('time-entry-1')
      expect(data.data.records).toHaveLength(1)
      expect(data.data.total_cost).toBe(63.75) // 2.5 * 25.50
    })

    it('should return no active session when no time entry found', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: { role: 'employee' },
              error: null
            })
          }
        }
        if (table === 'time_entries') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('No active time entry')
            })
          }
        }
        return mockSupabase
      })

      const request = new NextRequest('https://example.com/api/employee/material-usage/current')
      const response = await GetCurrent(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.has_active_session).toBe(false)
      expect(data.data.message).toBe('ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์')
    })
  })

  describe('POST /api/employee/material-usage', () => {
    it('should create material usage records for valid input', async () => {
      const mockTimeEntry = { id: 'time-entry-1' }
      const mockValidMaterials = [
        { id: 'material-1' },
        { id: 'material-2' }
      ]
      const mockCreatedRecords = [
        {
          id: 'usage-1',
          time_entry_id: 'time-entry-1',
          raw_material_id: 'material-1',
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

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: { role: 'employee' },
              error: null
            })
          }
        }
        if (table === 'time_entries') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: mockTimeEntry,
              error: null
            })
          }
        }
        if (table === 'raw_materials') {
          return {
            ...mockSupabase,
            in: vi.fn().mockResolvedValue({
              data: mockValidMaterials,
              error: null
            })
          }
        }
        if (table === 'material_usage') {
          return {
            ...mockSupabase,
            select: vi.fn().mockResolvedValue({
              data: mockCreatedRecords,
              error: null
            })
          }
        }
        return mockSupabase
      })

      const requestBody = {
        materials: [
          {
            raw_material_id: 'material-1',
            quantity_used: 2.5
          }
        ]
      }

      const request = new NextRequest('https://example.com/api/employee/material-usage', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.records).toHaveLength(1)
      expect(data.data.total_cost).toBe(63.75)
      expect(data.data.time_entry_id).toBe('time-entry-1')
    })

    it('should return 400 for invalid material data', async () => {
      const requestBody = {
        materials: [
          {
            raw_material_id: 'material-1',
            quantity_used: -1 // Invalid negative quantity
          }
        ]
      }

      const request = new NextRequest('https://example.com/api/employee/material-usage', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('จำนวนต้องเป็นตัวเลขบวกเท่านั้น')
    })

    it('should return 400 when no active time entry exists', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: { role: 'employee' },
              error: null
            })
          }
        }
        if (table === 'time_entries') {
          return {
            ...mockSupabase,
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('No active time entry')
            })
          }
        }
        return mockSupabase
      })

      const requestBody = {
        materials: [
          {
            raw_material_id: 'material-1',
            quantity_used: 2.5
          }
        ]
      }

      const request = new NextRequest('https://example.com/api/employee/material-usage', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์ กรุณาเช็คอินก่อนรายงานการใช้วัตถุดิบ')
    })

    it('should return 400 for empty materials array', async () => {
      const requestBody = {
        materials: []
      }

      const request = new NextRequest('https://example.com/api/employee/material-usage', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ')
    })
  })
})