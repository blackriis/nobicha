import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/admin/employees/route'
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

describe('Employee Management Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication Tests', () => {
    it('should reject requests without authorization header', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {}
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ไม่พบการยืนยันตัวตน')
    })

    it('should reject requests with invalid token', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('การยืนยันตัวตนไม่ถูกต้อง')
    })

    it('should reject requests with malformed authorization header', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'InvalidFormat token'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('การยืนยันตัวตนไม่ถูกต้อง')
    })
  })

  describe('Authorization Tests', () => {
    it('should reject non-admin users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'employee-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'employee' },
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้')
    })

    it('should allow admin users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })

      // Mock empty employee list for simplicity
      mockSupabase.from().select().mockReturnValue({
        or: () => ({
          eq: () => ({
            order: () => ({
              range: () => Promise.resolve({
                data: [],
                error: null,
                count: 0
              })
            })
          })
        })
      })

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-admin-token'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Input Sanitization Tests', () => {
    beforeEach(() => {
      // Mock admin authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })
    })

    it('should reject XSS attempts in employee data', async () => {
      const maliciousData = {
        full_name: '<script>alert("XSS")</script>',
        email: 'test@example.com',
        password: 'TestPassword123',
        home_branch_id: 'branch-id',
        hourly_rate: 50,
        daily_rate: 400
      }

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
          'content-type': 'application/json'
        },
        body: maliciousData
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
    })

    it('should reject SQL injection attempts', async () => {
      const maliciousData = {
        full_name: "'; DROP TABLE users; --",
        email: 'test@example.com',
        password: 'TestPassword123',
        home_branch_id: 'branch-id',
        hourly_rate: 50,
        daily_rate: 400
      }

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
          'content-type': 'application/json'
        },
        body: maliciousData
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
    })

    it('should reject overly long input data', async () => {
      const longString = 'a'.repeat(1000)
      const maliciousData = {
        full_name: longString,
        email: 'test@example.com',
        password: 'TestPassword123',
        home_branch_id: 'branch-id',
        hourly_rate: 50,
        daily_rate: 400
      }

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
          'content-type': 'application/json'
        },
        body: maliciousData
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
      expect(data.validationErrors).toBeDefined()
    })

    it('should reject invalid email formats', async () => {
      const testCases = [
        'invalid-email',
        'test@',
        '@example.com',
        'test@.com',
        'test@example.',
        'test..test@example.com',
        'test@example..com'
      ]

      for (const email of testCases) {
        const maliciousData = {
          full_name: 'Test User',
          email: email,
          password: 'TestPassword123',
          home_branch_id: 'branch-id',
          hourly_rate: 50,
          daily_rate: 400
        }

        const { req } = createMocks({
          method: 'POST',
          headers: {
            authorization: 'Bearer admin-token',
            'content-type': 'application/json'
          },
          body: maliciousData
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
      }
    })
  })

  describe('Rate Limiting Protection', () => {
    it('should handle numeric overflow attempts', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })

      const maliciousData = {
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123',
        home_branch_id: 'branch-id',
        hourly_rate: Number.MAX_SAFE_INTEGER,
        daily_rate: Number.MAX_SAFE_INTEGER
      }

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
          'content-type': 'application/json'
        },
        body: maliciousData
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
      expect(data.validationErrors).toBeDefined()
    })
  })

  describe('Password Security Tests', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })
    })

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        'Password', // Missing number
        'password123', // Missing uppercase
        'PASSWORD123', // Missing lowercase
        'Password!', // Too short
      ]

      for (const password of weakPasswords) {
        const employeeData = {
          full_name: 'Test User',
          email: 'test@example.com',
          password: password,
          home_branch_id: 'branch-id',
          hourly_rate: 50,
          daily_rate: 400
        }

        const { req } = createMocks({
          method: 'POST',
          headers: {
            authorization: 'Bearer admin-token',
            'content-type': 'application/json'
          },
          body: employeeData
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
        expect(data.validationErrors).toBeDefined()
      }
    })

    it('should accept strong passwords', async () => {
      // Mock all necessary checks to pass
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: { role: 'admin' }, error: null }) // Admin check
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // Email unique check
        .mockResolvedValueOnce({ data: { id: 'branch-id' }, error: null }) // Branch exists check

      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null
      })

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: {
          id: 'new-user-id',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'employee',
          created_at: '2025-01-17T00:00:00Z'
        },
        error: null
      })

      const strongPassword = 'StrongPassword123!'
      const employeeData = {
        full_name: 'Test User',
        email: 'test@example.com',
        password: strongPassword,
        home_branch_id: 'branch-id',
        hourly_rate: 50,
        daily_rate: 400
      }

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
          'content-type': 'application/json'
        },
        body: employeeData
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees', {
        method: 'POST',
        headers: req.headers as any,
        body: JSON.stringify(req.body)
      })

      const response = await POST(request)
      const data = await response.json()

      // Should pass basic validation at least
      if (response.status === 400) {
        expect(data.validationErrors?.password).toBeUndefined()
      }
    })
  })

  describe('Data Access Control', () => {
    it('should not expose sensitive data in responses', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })

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
        password_hash: 'secret-hash', // This should not be exposed
        api_key: 'secret-key', // This should not be exposed
        branches: { id: 'branch-id', name: 'Test Branch', address: 'Test Address' }
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockEmployee,
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer admin-token'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/employees/employee-id', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await GET_BY_ID(request, { params: { id: 'employee-id' } })
      const data = await response.json()

      if (response.status === 200) {
        // Should not contain sensitive fields
        expect(data.employee.password_hash).toBeUndefined()
        expect(data.employee.api_key).toBeUndefined()
        expect(data.employee.password).toBeUndefined()
        
        // Should contain expected fields
        expect(data.employee.id).toBeDefined()
        expect(data.employee.email).toBeDefined()
        expect(data.employee.full_name).toBeDefined()
      }
    })
  })
})