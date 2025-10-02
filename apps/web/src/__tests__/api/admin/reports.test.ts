/**
 * Admin Reports API Tests
 * Tests the admin reports endpoints for functionality and security
 */

import { NextRequest } from 'next/server'

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      })),
      gte: jest.fn(() => ({
        limit: jest.fn(),
        order: jest.fn()
      })),
      filter: jest.fn(),
      order: jest.fn()
    }))
  }))
}

const mockAdminClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      })),
      gte: jest.fn(),
      order: jest.fn(),
      limit: jest.fn()
    }))
  }))
}

// Mock rate limiter
const mockRateLimiter = {
  checkLimit: jest.fn()
}

// Mock the modules
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
  createSupabaseServerClient: jest.fn(() => mockAdminClient)
}))

jest.mock('@/lib/rate-limit', () => ({
  authRateLimiter: mockRateLimiter
}))

describe('Admin Reports API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock responses
    mockRateLimiter.checkLimit.mockResolvedValue({ allowed: true })
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user-id' } },
      error: null
    })
  })

  describe('GET /api/admin/reports/summary', () => {
    it('should require authentication', async () => {
      // Mock unauthenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unauthorized' }
      })

      const { GET } = await import('@/app/api/admin/reports/summary/route')
      const request = new NextRequest('https://example.com/api/admin/reports/summary')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should require admin role', async () => {
      // Mock employee user
      mockAdminClient.from().select().eq().single.mockResolvedValue({
        data: { role: 'employee' },
        error: null
      })

      const { GET } = await import('@/app/api/admin/reports/summary/route')
      const request = new NextRequest('https://example.com/api/admin/reports/summary')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Admin access required')
    })

    it('should handle rate limiting', async () => {
      mockRateLimiter.checkLimit.mockResolvedValue({ allowed: false })

      const { GET } = await import('@/app/api/admin/reports/summary/route')
      const request = new NextRequest('https://example.com/api/admin/reports/summary')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many requests. Please try again later.')
    })

    it('should return summary data for admin user', async () => {
      // Mock admin user
      mockAdminClient.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })

      // Mock parallel queries
      const mockQueries = [
        { count: 45 }, // total employees
        { count: 8 },  // active branches
        { count: 32 }, // today check-ins
        { data: [{ total_sales: 50000 }, { total_sales: 30000 }] }, // sales
        { count: 127 }, // materials
        { data: [{ total_cost: 5000 }, { total_cost: 3000 }] } // material usage
      ]

      mockAdminClient.from.mockImplementation((_table: string) => {
        let queryCount = 0
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(),
              gte: jest.fn(() => Promise.resolve(mockQueries[queryCount++]))
            })),
            gte: jest.fn(() => Promise.resolve(mockQueries[queryCount++])),
            filter: jest.fn(() => Promise.resolve(mockQueries[queryCount++]))
          }))
        }
      })

      const { GET } = await import('@/app/api/admin/reports/summary/route')
      const request = new NextRequest('https://example.com/api/admin/reports/summary?dateRange=today')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('employees')
      expect(data.data).toHaveProperty('branches')
      expect(data.data).toHaveProperty('sales')
      expect(data.data).toHaveProperty('materials')
    })
  })

  describe('GET /api/admin/reports/employees', () => {
    it('should return employee work reports', async () => {
      // Mock admin user
      mockAdminClient.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })

      // Mock employee data
      const mockEmployeeData = [
        {
          user_id: 'user1',
          total_hours: 8.5,
          users: { 
            id: 'user1', 
            full_name: 'จอห์น โด', 
            employee_id: 'EMP001' 
          },
          branches: { 
            id: 'branch1', 
            name: 'สาขาหลัก' 
          },
          check_out_time: '2023-12-01T17:00:00Z'
        }
      ]

      mockAdminClient.from().select().gte().order().limit.mockResolvedValue({
        data: mockEmployeeData,
        error: null
      })

      const { GET } = await import('@/app/api/admin/reports/employees/route')
      const request = new NextRequest('https://example.com/api/admin/reports/employees?dateRange=today')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('summary')
      expect(data.data).toHaveProperty('employees')
      expect(Array.isArray(data.data.employees)).toBe(true)
    })
  })

  describe('GET /api/admin/reports/branches', () => {
    it('should return branch performance reports', async () => {
      // Mock admin user
      mockAdminClient.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })

      // Mock branches data
      const mockBranches = [
        {
          id: 'branch1',
          name: 'สาขาหลัก',
          address: '123 ถนนใหญ่'
        }
      ]

      mockAdminClient.from().select().order.mockResolvedValue({
        data: mockBranches,
        error: null
      })

      const { GET } = await import('@/app/api/admin/reports/branches/route')
      const request = new NextRequest('https://example.com/api/admin/reports/branches?dateRange=today')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('summary')
      expect(data.data).toHaveProperty('branches')
    })
  })

  describe('Date Range Handling', () => {
    beforeEach(() => {
      mockAdminClient.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })
    })

    it('should handle today date range', async () => {
      const { GET } = await import('@/app/api/admin/reports/summary/route')
      const request = new NextRequest('https://example.com/api/admin/reports/summary?dateRange=today')
      
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should handle week date range', async () => {
      const { GET } = await import('@/app/api/admin/reports/summary/route')
      const request = new NextRequest('https://example.com/api/admin/reports/summary?dateRange=week')
      
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should handle month date range', async () => {
      const { GET } = await import('@/app/api/admin/reports/summary/route')
      const request = new NextRequest('https://example.com/api/admin/reports/summary?dateRange=month')
      
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should handle custom date range', async () => {
      const { GET } = await import('@/app/api/admin/reports/summary/route')
      const request = new NextRequest('https://example.com/api/admin/reports/summary?dateRange=custom&startDate=2023-12-01&endDate=2023-12-31')
      
      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAdminClient.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockAdminClient.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const { GET } = await import('@/app/api/admin/reports/summary/route')
      const request = new NextRequest('https://example.com/api/admin/reports/summary')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})

describe('Admin Reports Service Layer', () => {
  let adminReportsService: typeof import('@/lib/services/admin-reports.service').adminReportsService

  beforeEach(async () => {
    // Mock fetch for service layer tests
    global.fetch = jest.fn()
    
    const moduleImport = await import('@/lib/services/admin-reports.service')
    adminReportsService = moduleImport.adminReportsService
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getSummaryReport', () => {
    it('should fetch summary report successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          employees: { total: 45, checkedInToday: 32, attendanceRate: 71 },
          branches: { total: 8, active: 8 },
          sales: { total: 80000, period: 'today', currency: 'THB' },
          materials: { totalItems: 127, recentUsageCost: 8000, currency: 'THB' }
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const result = await adminReportsService.getSummaryReport({ type: 'today' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
      expect(result.error).toBeNull()
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' })
      })

      const result = await adminReportsService.getSummaryReport({ type: 'today' })

      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await adminReportsService.getSummaryReport({ type: 'today' })

      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลสรุปรายงาน')
    })
  })

  describe('validateDateRange', () => {
    it('should validate correct date ranges', () => {
      const validRanges = [
        { type: 'today' as const },
        { type: 'week' as const },
        { type: 'month' as const },
        { 
          type: 'custom' as const, 
          startDate: '2023-12-01', 
          endDate: '2023-12-31' 
        }
      ]

      validRanges.forEach(range => {
        const result = adminReportsService.validateDateRange(range)
        expect(result.valid).toBe(true)
      })
    })

    it('should reject invalid date ranges', () => {
      const invalidRanges = [
        { type: 'custom' as const }, // Missing dates
        { 
          type: 'custom' as const, 
          startDate: '2023-12-31', 
          endDate: '2023-12-01' 
        }, // End before start
        { 
          type: 'custom' as const, 
          startDate: 'invalid-date', 
          endDate: '2023-12-31' 
        } // Invalid date format
      ]

      invalidRanges.forEach(range => {
        const result = adminReportsService.validateDateRange(range)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })

  describe('formatCurrency', () => {
    it('should format Thai currency correctly', () => {
      const amounts = [
        { input: 1000, expected: '฿1,000' },
        { input: 1500.50, expected: '฿1,501' },
        { input: 0, expected: '฿0' }
      ]

      amounts.forEach(({ input }) => {
        const result = adminReportsService.formatCurrency(input)
        expect(result).toContain('฿')
        expect(result).toContain(input.toLocaleString())
      })
    })
  })
})