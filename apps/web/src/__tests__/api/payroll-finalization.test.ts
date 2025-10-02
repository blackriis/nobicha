import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Create mock functions with proper mocking setup
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser
    },
    from: mockFrom
  }))
}))

vi.mock('@/lib/rate-limit', () => ({
  importantRateLimiter: {
    isRateLimited: vi.fn(() => ({ limited: false }))
  },
  criticalRateLimiter: {
    isRateLimited: vi.fn(() => ({ limited: false }))
  },
  generalRateLimiter: {
    isRateLimited: vi.fn(() => ({ limited: false }))
  },
  createRateLimitResponse: vi.fn()
}))

vi.mock('@/lib/services/audit.service', () => ({
  auditService: {
    createAuditLog: vi.fn(() => ({ success: true }))
  }
}))

describe('Fixed Payroll Finalization API Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/payroll-cycles/[id]/summary', () => {
    const createMockRequest = () => {
      return new NextRequest('https://example.com/api/admin/payroll-cycles/test-id/summary')
    }

    it('should return payroll summary successfully', async () => {
      // Setup authenticated admin
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      const mockCycle = {
        id: 'test-cycle-id',
        name: 'เงินเดือนมกราคม 2568',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }

      const mockPayrollDetails = [
        {
          id: 'detail-1',
          user_id: 'user-1',
          base_pay: 30000,
          overtime_pay: 5000,
          bonus: 2000,
          bonus_reason: 'ผลงานดี',
          deduction: 500,
          deduction_reason: 'มาสาย',
          net_pay: 36500,
          calculation_method: 'hourly',
          users: {
            id: 'user-1',
            full_name: 'สมชาย ใจดี',
            employee_id: 'EMP001',
            branches: {
              id: 'branch-1',
              name: 'สาขาหลัก'
            }
          }
        }
      ]

      // Setup mockFrom calls in sequence
      mockFrom
        // 1st call: admin role check
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
        // 2nd call: cycle query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCycle,
                error: null
              })
            })
          })
        })
        // 3rd call: payroll details query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockPayrollDetails,
                error: null
              })
            })
          })
        })

      const { GET } = await import('@/app/api/admin/payroll-cycles/[id]/summary/route')
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'test-cycle-id' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('ดึงข้อมูลสรุปรอบการจ่ายเงินเดือนเรียบร้อยแล้ว')
      expect(result.summary).toBeDefined()
      expect(result.summary.cycle_info.name).toBe('เงินเดือนมกราคม 2568')
      expect(result.summary.totals.total_employees).toBe(1)
      expect(result.summary.totals.total_net_pay).toBe(36500)
      expect(result.summary.validation.can_finalize).toBe(true)
    })

    it('should detect validation issues', async () => {
      // Setup authenticated admin
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      const mockCycle = {
        id: 'test-cycle-id',
        name: 'เงินเดือนทดสอบ',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }

      const mockPayrollDetailsWithIssues = [
        {
          id: 'detail-1',
          user_id: 'user-1',
          base_pay: 10000,
          overtime_pay: 0,
          bonus: 0,
          bonus_reason: null,
          deduction: 15000,
          deduction_reason: 'หักมากเกินไป',
          net_pay: -5000, // Negative net pay
          calculation_method: 'daily',
          users: {
            id: 'user-1',
            full_name: 'พนักงานทดสอบ',
            employee_id: 'EMP999',
            branches: {
              id: 'branch-1',
              name: 'สาขาทดสอบ'
            }
          }
        }
      ]

      // Setup mockFrom calls in sequence
      mockFrom
        // 1st call: admin role check
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
        // 2nd call: cycle query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCycle,
                error: null
              })
            })
          })
        })
        // 3rd call: payroll details query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockPayrollDetailsWithIssues,
                error: null
              })
            })
          })
        })

      const { GET } = await import('@/app/api/admin/payroll-cycles/[id]/summary/route')
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'test-cycle-id' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.summary.validation.can_finalize).toBe(false)
      expect(result.summary.validation.employees_with_negative_net_pay).toBe(1)
      expect(result.summary.validation.validation_issues).toHaveLength(1)
      expect(result.summary.validation.validation_issues[0].type).toBe('negative_net_pay')
    })

    it('should reject unauthorized access', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const { GET } = await import('@/app/api/admin/payroll-cycles/[id]/summary/route')
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'test-cycle-id' } })
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ')
    })

    it('should reject non-admin access', async () => {
      // Setup authenticated non-admin user
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'regular-user-id' } },
        error: null
      })

      // Mock admin role check with non-admin user
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'employee' },
              error: null
            })
          })
        })
      })

      const { GET } = await import('@/app/api/admin/payroll-cycles/[id]/summary/route')
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'test-cycle-id' } })
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('ไม่ได้รับอนุญาต - ต้องเป็น Admin เท่านั้น')
    })
  })

  describe('POST /api/admin/payroll-cycles/[id]/finalize', () => {
    const createMockRequest = () => {
      return new NextRequest('https://example.com/api/admin/payroll-cycles/test-id/finalize', {
        method: 'POST'
      })
    }

    it('should finalize payroll cycle successfully', async () => {
      // Setup authenticated admin
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      const mockCycle = {
        id: 'test-cycle-id',
        name: 'เงินเดือนมกราคม 2568',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }

      const mockPayrollDetails = [
        {
          id: 'detail-1',
          user_id: 'user-1',
          base_pay: 30000,
          overtime_pay: 5000,
          bonus: 2000,
          deduction: 500,
          net_pay: 36500,
          users: {
            id: 'user-1',
            full_name: 'สมชาย ใจดี',
            employee_id: 'EMP001'
          }
        }
      ]

      const mockFinalizedCycle = {
        ...mockCycle,
        status: 'completed',
        finalized_at: '2025-01-31T23:59:59Z',
        finalized_by: 'admin-user-id',
        total_employees: 1,
        total_amount: 36500
      }

      // Setup mockFrom calls in sequence
      mockFrom
        // 1st call: admin role check
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
        // 2nd call: cycle query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCycle,
                error: null
              })
            })
          })
        })
        // 3rd call: payroll details query for validation
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockPayrollDetails,
              error: null
            })
          })
        })
        // 4th call: cycle update
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockFinalizedCycle,
                  error: null
                })
              })
            })
          })
        })

      const { POST } = await import('@/app/api/admin/payroll-cycles/[id]/finalize/route')
      const request = createMockRequest()
      const response = await POST(request, { params: { id: 'test-cycle-id' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toContain('ปิดรอบการจ่ายเงินเดือน "เงินเดือนมกราคม 2568" เรียบร้อยแล้ว')
      expect(result.finalization_summary.cycle_info.status).toBe('completed')
      expect(result.finalization_summary.totals.total_employees).toBe(1)
      expect(result.finalization_summary.totals.total_net_pay).toBe(36500)
    })

    it('should reject finalization with negative net pay employees', async () => {
      // Setup authenticated admin
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      const mockCycle = {
        id: 'test-cycle-id',
        name: 'เงินเดือนทดสอบ',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }

      const mockPayrollDetailsWithNegativePay = [
        {
          id: 'detail-1',
          user_id: 'user-1',
          base_pay: 10000,
          overtime_pay: 0,
          bonus: 0,
          deduction: 15000,
          net_pay: -5000, // Negative net pay
          users: {
            id: 'user-1',
            full_name: 'พนักงานทดสอบ',
            employee_id: 'EMP999'
          }
        }
      ]

      // Setup mockFrom calls in sequence
      mockFrom
        // 1st call: admin role check
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
        // 2nd call: cycle query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCycle,
                error: null
              })
            })
          })
        })
        // 3rd call: payroll details query for validation
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockPayrollDetailsWithNegativePay,
              error: null
            })
          })
        })

      const { POST } = await import('@/app/api/admin/payroll-cycles/[id]/finalize/route')
      const request = createMockRequest()
      const response = await POST(request, { params: { id: 'test-cycle-id' } })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('ไม่สามารถปิดรอบได้ เนื่องจากมีพนักงานที่มีเงินเดือนสุทธิติดลบ')
      expect(result.invalid_employees).toHaveLength(1)
      expect(result.invalid_employees[0].name).toBe('พนักงานทดสอบ')
      expect(result.invalid_employees[0].net_pay).toBe(-5000)
    })
  })

  describe('GET /api/admin/payroll-cycles/[id]/export', () => {
    const createMockRequest = (format = 'csv', includeDetails = 'true') => {
      return new NextRequest(`https://example.com/api/admin/payroll-cycles/test-id/export?format=${format}&include_details=${includeDetails}`)
    }

    it('should export JSON successfully', async () => {
      // Setup authenticated admin
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })

      const mockCycle = {
        id: 'test-cycle-id',
        name: 'เงินเดือนมกราคม 2568',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        status: 'completed',
        created_at: '2025-01-01T00:00:00Z'
      }

      const mockPayrollDetails = [
        {
          id: 'detail-1',
          user_id: 'user-1',
          base_pay: 30000,
          overtime_pay: 5000,
          bonus: 2000,
          deduction: 500,
          net_pay: 36500,
          calculation_method: 'hourly',
          users: {
            id: 'user-1',
            full_name: 'สมชาย ใจดี',
            employee_id: 'EMP001',
            email: 'somchai@company.com',
            branches: {
              id: 'branch-1',
              name: 'สาขาหลัก'
            }
          }
        }
      ]

      // Setup mockFrom calls in sequence
      mockFrom
        // 1st call: admin role check
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
        // 2nd call: cycle query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCycle,
                error: null
              })
            })
          })
        })
        // 3rd call: payroll details query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockPayrollDetails,
                error: null
              })
            })
          })
        })

      const { GET } = await import('@/app/api/admin/payroll-cycles/[id]/export/route')
      const request = createMockRequest('json', 'true')
      const response = await GET(request, { params: { id: 'test-cycle-id' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('ส่งออกข้อมูลเงินเดือนเรียบร้อยแล้ว')
      expect(result.export_data.cycle_info.name).toBe('เงินเดือนมกราคม 2568')
      expect(result.export_data.summary.total_employees).toBe(1)
      expect(result.export_data.summary.total_net_pay).toBe(36500)
      expect(result.export_data.employee_details).toHaveLength(1)
    })
  })
})