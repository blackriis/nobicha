import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { PayrollCycleInsert } from 'packages/database/types'

// Mock types for Supabase client
interface MockSupabaseClient {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

interface MockAuthUser {
  id: string
}

interface MockAuthResponse {
  data: { user: MockAuthUser | null }
  error: Error | null
}

interface MockUserProfile {
  role: string
}

interface MockProfileResponse {
  data: MockUserProfile | null
  error: { code?: string } | null
}

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          or: vi.fn(),
          order: vi.fn(),
        })),
        or: vi.fn(),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        order: vi.fn(() => ({
          ascending: vi.fn()
        }))
      }))
    }))
  }))
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn()
}))

describe('/api/admin/payroll-cycles API', () => {
  let mockSupabase: MockSupabaseClient
  let mockRateLimit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn()
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            or: vi.fn(),
            order: vi.fn(),
          })),
          or: vi.fn(),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn()
            }))
          })),
          order: vi.fn(() => ({
            ascending: vi.fn()
          }))
        }))
      }))
    }
    
    mockRateLimit = vi.fn()
    
    // Mock the imports
    const { createClient } = await import('@/lib/supabase')
    const { rateLimit } = await import('@/lib/rate-limit')
    vi.mocked(createClient).mockReturnValue(mockSupabase as MockSupabaseClient & Record<string, unknown>)
    vi.mocked(rateLimit).mockImplementation(mockRateLimit)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/admin/payroll-cycles', () => {
    const validPayload = {
      name: 'เงินเดือนมกราคม 2568',
      start_date: '2025-01-01',
      end_date: '2025-01-31'
    }

    const createMockRequest = (payload: PayrollCycleInsert | Partial<PayrollCycleInsert>) => {
      return {
        json: vi.fn().mockResolvedValue(payload)
      } as unknown as NextRequest
    }

    const setupAuthenticatedAdmin = () => {
      (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      } as MockAuthResponse)
      
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            } as MockProfileResponse)
          })
        })
      })
    }

    const setupUnauthorizedUser = () => {
      (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      } as MockAuthResponse)
    }

    const setupNonAdminUser = () => {
      (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: { id: 'employee-user-id' } },
        error: null
      } as MockAuthResponse)
      
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'employee' },
              error: null
            } as MockProfileResponse)
          })
        })
      })
    }

    it('should create payroll cycle successfully', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupAuthenticatedAdmin()
      
      // Mock overlapping check - no conflicts
      const mockOverlapQuery = {
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }
      
      // Mock name check - no duplicates
      const mockNameQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows found
            })
          })
        })
      }
      
      // Mock successful insert
      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-cycle-id', ...validPayload, status: 'active' },
              error: null
            })
          })
        })
      }

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockOverlapQuery) // First call for overlap check
        .mockReturnValueOnce(mockNameQuery)    // Second call for name check  
        .mockReturnValueOnce(mockInsertQuery)  // Third call for insert

      const { POST } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest(validPayload)
      
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(201)
      expect(result.message).toBe('สร้างรอบการจ่ายเงินเดือนเรียบร้อยแล้ว')
      expect(result.payroll_cycle.name).toBe(validPayload.name)
    })

    it('should reject unauthorized access', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupUnauthorizedUser()

      const { POST } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest(validPayload)
      
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(401)
      expect(result.error).toBe('ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ')
    })

    it('should reject non-admin users', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupNonAdminUser()

      const { POST } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest(validPayload)
      
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(403)
      expect(result.error).toBe('ไม่ได้รับอนุญาต - ต้องเป็น Admin เท่านั้น')
    })

    it('should reject invalid payload - missing name', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupAuthenticatedAdmin()

      const invalidPayload = { ...validPayload, name: '' }
      
      const { POST } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest(invalidPayload)
      
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(400)
      expect(result.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อรอบ วันที่เริ่มต้น วันที่สิ้นสุด')
    })

    it('should reject invalid date range', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupAuthenticatedAdmin()

      const invalidPayload = { 
        ...validPayload, 
        start_date: '2025-01-31',
        end_date: '2025-01-01'
      }
      
      const { POST } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest(invalidPayload)
      
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(400)
      expect(result.error).toBe('วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด')
    })

    it('should reject overlapping date ranges', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupAuthenticatedAdmin()
      
      // Mock overlapping check - found conflicts
      const mockOverlapQuery = {
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({
            data: [{
              id: 'existing-cycle-id',
              name: 'รอบที่ซ้อน',
              start_date: '2025-01-15',
              end_date: '2025-02-15'
            }],
            error: null
          })
        })
      }

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockOverlapQuery)

      const { POST } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest(validPayload)
      
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(400)
      expect(result.error).toBe('ช่วงวันที่ทับซ้อนกับรอบการจ่ายเงินเดือนที่มีอยู่แล้ว')
      expect(result.conflicting_cycles).toBeDefined()
    })

    it('should reject duplicate cycle names', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupAuthenticatedAdmin()
      
      // Mock overlap check - no conflicts
      const mockOverlapQuery = {
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }
      
      // Mock name check - found duplicate
      const mockNameQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-id' },
              error: null
            })
          })
        })
      }

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockOverlapQuery)
        .mockReturnValueOnce(mockNameQuery)

      const { POST } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest(validPayload)
      
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(400)
      expect(result.error).toBe('ชื่อรอบการจ่ายเงินเดือนนี้มีอยู่แล้ว')
    })

    it('should handle rate limiting', async () => {
      const rateLimitResponse = new Response(JSON.stringify({ error: 'Rate limited' }), {
        status: 429
      })
      mockRateLimit.mockResolvedValue(rateLimitResponse)

      const { POST } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest(validPayload)
      
      const response = await POST(request)
      
      expect(response.status).toBe(429)
    })
  })

  describe('GET /api/admin/payroll-cycles', () => {
    const createMockRequest = () => {
      return {} as NextRequest
    }

    const setupAuthenticatedAdmin = () => {
      (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      } as MockAuthResponse)
      
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            } as MockProfileResponse)
          })
        })
      })
    }

    it('should fetch payroll cycles successfully', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupAuthenticatedAdmin()
      
      const mockCycles = [
        {
          id: '1',
          name: 'เงินเดือนมกราคม 2568',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          status: 'active',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'เงินเดือนกุมภาพันธ์ 2568',
          start_date: '2025-02-01',
          end_date: '2025-02-28',
          status: 'completed',
          created_at: '2025-02-01T00:00:00Z'
        }
      ]
      
      // Mock successful fetch
      const mockFetchQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCycles,
            error: null
          })
        })
      }

(mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockFetchQuery)

      const { GET } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest()
      
      const response = await GET(request)
      const result = await response.json()
      
      expect(response.status).toBe(200)
      expect(result.payroll_cycles).toHaveLength(2)
      expect(result.payroll_cycles[0].name).toBe('เงินเดือนมกราคม 2568')
    })

    it('should return empty array when no cycles exist', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupAuthenticatedAdmin()
      
      const mockFetchQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }

(mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockFetchQuery)

      const { GET } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest()
      
      const response = await GET(request)
      const result = await response.json()
      
      expect(response.status).toBe(200)
      expect(result.payroll_cycles).toHaveLength(0)
    })

    it('should handle database errors', async () => {
      mockRateLimit.mockResolvedValue(null)
      setupAuthenticatedAdmin()
      
      const mockFetchQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database connection failed')
          })
        })
      }

(mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockFetchQuery)

      const { GET } = await import('@/app/api/admin/payroll-cycles/route')
      const request = createMockRequest()
      
      const response = await GET(request)
      const result = await response.json()
      
      expect(response.status).toBe(500)
      expect(result.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลรอบการจ่ายเงินเดือน')
    })
  })
})