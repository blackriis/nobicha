import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/admin/employees/route'
import { NextRequest } from 'next/server'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }))
}))

const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
}

// Mock Employee Service
const mockEmployeeService = {
  getEmployeeList: vi.fn()
}

vi.mock('@/lib/services/employee.service', () => ({
  EmployeeService: vi.fn(() => mockEmployeeService)
}))

describe('/api/admin/employees GET', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest = new NextRequest('http://localhost:3000/api/admin/employees')
  })

  it('should return 401 if no authorization header', async () => {
    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('ไม่พบการยืนยันตัวตน')
  })

  it('should return 401 if invalid token', async () => {
    const requestWithAuth = new NextRequest('http://localhost:3000/api/admin/employees', {
      headers: { authorization: 'Bearer invalid-token' }
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid token')
    })

    const response = await GET(requestWithAuth)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('การยืนยันตัวตนไม่ถูกต้อง')
  })

  it('should return 403 if user is not admin', async () => {
    const requestWithAuth = new NextRequest('http://localhost:3000/api/admin/employees', {
      headers: { authorization: 'Bearer valid-token' }
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'employee' },
      error: null
    })

    const response = await GET(requestWithAuth)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้')
  })

  it('should return employee list for admin user', async () => {
    const requestWithAuth = new NextRequest('http://localhost:3000/api/admin/employees?search=john&page=1&limit=20', {
      headers: { authorization: 'Bearer valid-token' }
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    const mockEmployees = [
      {
        id: 'emp-1',
        email: 'john@example.com',
        full_name: 'John Doe',
        role: 'employee',
        branch_id: 'branch-1',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    mockEmployeeService.getEmployeeList.mockResolvedValue({
      data: mockEmployees,
      total: 1,
      page: 1,
      limit: 20
    })

    const response = await GET(requestWithAuth)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockEmployees)
    expect(data.total).toBe(1)
    expect(mockEmployeeService.getEmployeeList).toHaveBeenCalledWith(
      {
        search: 'john',
        branchId: undefined,
        role: undefined,
        status: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc'
      },
      {
        page: 1,
        limit: 20
      }
    )
  })

  it('should handle query parameters correctly', async () => {
    const requestWithParams = new NextRequest(
      'http://localhost:3000/api/admin/employees?search=test&role=employee&status=active&branchId=branch-1&sortBy=full_name&sortOrder=asc&page=2&limit=50',
      {
        headers: { authorization: 'Bearer valid-token' }
      }
    )

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    mockEmployeeService.getEmployeeList.mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      limit: 50
    })

    await GET(requestWithParams)

    expect(mockEmployeeService.getEmployeeList).toHaveBeenCalledWith(
      {
        search: 'test',
        branchId: 'branch-1',
        role: 'employee',
        status: 'active',
        sortBy: 'full_name',
        sortOrder: 'asc'
      },
      {
        page: 2,
        limit: 50
      }
    )
  })

  it('should limit page size to 100', async () => {
    const requestWithLargeLimit = new NextRequest(
      'http://localhost:3000/api/admin/employees?limit=500',
      {
        headers: { authorization: 'Bearer valid-token' }
      }
    )

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    mockEmployeeService.getEmployeeList.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 100
    })

    await GET(requestWithLargeLimit)

    expect(mockEmployeeService.getEmployeeList).toHaveBeenCalledWith(
      expect.any(Object),
      {
        page: 1,
        limit: 100
      }
    )
  })

  it('should handle service errors', async () => {
    const requestWithAuth = new NextRequest('http://localhost:3000/api/admin/employees', {
      headers: { authorization: 'Bearer valid-token' }
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    mockEmployeeService.getEmployeeList.mockRejectedValue(
      new Error('Database connection failed')
    )

    const response = await GET(requestWithAuth)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Database connection failed')
  })
})