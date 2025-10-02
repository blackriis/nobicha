import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { POST, PUT, GET } from '@/app/api/admin/employees/route'
import { GET as GET_BY_ID, PUT as PUT_BY_ID } from '@/app/api/admin/employees/[id]/route'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn()
    }
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }))
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}))

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
  }
}))

describe('Employee Management API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/admin/employees', () => {
    it('should create a new employee successfully', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      // Mock admin check
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })

      // Mock email uniqueness check
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found
      })

      // Mock branch existence check
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: 'branch-id' },
        error: null
      })

      // Mock auth user creation
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null
      })

      // Mock user record creation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: {
          id: 'new-user-id',
          email: 'test@example.com',
          full_name: 'Test Employee',
          role: 'employee',
          home_branch_id: 'branch-id',
          hourly_rate: 50,
          daily_rate: 400,
          is_active: true,
          created_at: '2025-01-17T00:00:00Z'
        },
        error: null
      })

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: {
          full_name: 'Test Employee',
          email: 'test@example.com',
          password: 'TestPassword123',
          home_branch_id: 'branch-id',
          hourly_rate: 50,
          daily_rate: 400
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'POST',
        headers: req.headers as any,
        body: JSON.stringify(req.body)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.message).toBe('สร้างพนักงานใหม่สำเร็จ')
      expect(data.employee).toBeDefined()
      expect(data.employee.email).toBe('test@example.com')
    })

    it('should return 400 for invalid data', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: {
          full_name: 'A', // Too short
          email: 'invalid-email',
          password: '123', // Too short
          home_branch_id: '',
          hourly_rate: -1, // Invalid
          daily_rate: 99999 // Too high
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'POST',
        headers: req.headers as any,
        body: JSON.stringify(req.body)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('ข้อมูลไม่ถูกต้อง')
      expect(data.validationErrors).toBeDefined()
      expect(data.validationErrors.length).toBeGreaterThan(0)
    })

    it('should return 409 for duplicate email', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })

      // Mock existing user check
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: 'existing-user-id' },
        error: null
      })

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: {
          full_name: 'Test Employee',
          email: 'existing@example.com',
          password: 'TestPassword123',
          home_branch_id: 'branch-id',
          hourly_rate: 50,
          daily_rate: 400
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'POST',
        headers: req.headers as any,
        body: JSON.stringify(req.body)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toBe('อีเมลนี้มีอยู่ในระบบแล้ว')
    })

    it('should return 401 for unauthorized access', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: {
          full_name: 'Test Employee',
          email: 'test@example.com',
          password: 'TestPassword123',
          home_branch_id: 'branch-id',
          hourly_rate: 50,
          daily_rate: 400
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'POST',
        headers: req.headers as any,
        body: JSON.stringify(req.body)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ไม่พบการยืนยันตัวตน')
    })
  })

  describe('GET /api/admin/employees/[id]', () => {
    it('should get employee by ID successfully', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })

      // Mock employee data
      const mockEmployee = {
        id: 'employee-id',
        email: 'test@example.com',
        full_name: 'Test Employee',
        role: 'employee',
        home_branch_id: 'branch-id',
        hourly_rate: 50,
        daily_rate: 400,
        is_active: true,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
        branches: {
          id: 'branch-id',
          name: 'Test Branch',
          address: 'Test Address'
        }
      }

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockEmployee,
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees/employee-id', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await GET_BY_ID(request, { params: { id: 'employee-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('ดึงข้อมูลพนักงานสำเร็จ')
      expect(data.employee).toBeDefined()
      expect(data.employee.id).toBe('employee-id')
      expect(data.employee.branch_name).toBe('Test Branch')
    })

    it('should return 404 for non-existent employee', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })

      // Mock employee not found
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees/non-existent', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await GET_BY_ID(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('ไม่พบพนักงานรายการนี้')
    })
  })

  describe('PUT /api/admin/employees/[id]', () => {
    it('should update employee successfully', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })

      // Mock existing employee check
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: 'employee-id', email: 'test@example.com' },
        error: null
      })

      // Mock branch existence check
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: 'new-branch-id' },
        error: null
      })

      // Mock update result
      const updatedEmployee = {
        id: 'employee-id',
        email: 'test@example.com',
        full_name: 'Updated Employee',
        role: 'employee',
        home_branch_id: 'new-branch-id',
        hourly_rate: 60,
        daily_rate: 480,
        is_active: true,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T01:00:00Z',
        branches: {
          id: 'new-branch-id',
          name: 'New Branch',
          address: 'New Address'
        }
      }

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: updatedEmployee,
        error: null
      })

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: {
          full_name: 'Updated Employee',
          home_branch_id: 'new-branch-id',
          hourly_rate: 60,
          daily_rate: 480,
          is_active: true
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees/employee-id', {
        method: 'PUT',
        headers: req.headers as any,
        body: JSON.stringify(req.body)
      })

      const response = await PUT_BY_ID(request, { params: { id: 'employee-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('อัพเดทข้อมูลพนักงานสำเร็จ')
      expect(data.employee).toBeDefined()
      expect(data.employee.full_name).toBe('Updated Employee')
      expect(data.employee.hourly_rate).toBe(60)
    })

    it('should return 404 for non-existent employee', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })

      // Mock employee not found
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: {
          full_name: 'Updated Employee',
          home_branch_id: 'branch-id',
          hourly_rate: 60,
          daily_rate: 480,
          is_active: true
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees/non-existent', {
        method: 'PUT',
        headers: req.headers as any,
        body: JSON.stringify(req.body)
      })

      const response = await PUT_BY_ID(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('ไม่พบพนักงานรายการนี้')
    })
  })
})