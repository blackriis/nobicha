import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as salesReportsGET, POST as salesReportsPOST } from '@/app/api/employee/sales-reports/route'
import type { User, SalesReport } from 'packages/database/types'

// Mock types for Supabase client
interface MockSupabaseClient {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
  storage: {
    from: ReturnType<typeof vi.fn>
  }
}

interface MockAuthResponse {
  data: { user: { id: string } | null }
  error: Error | null
}

interface MockUserResponse {
  data: User | null
  error: { code?: string; message?: string } | null
}

interface MockSalesReportsResponse {
  data: SalesReport[] | null
  error: Error | null
}

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  generalRateLimiter: {
    checkLimit: vi.fn(),
  },
}))

import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'
import { generalRateLimiter } from '@/lib/rate-limit'

describe('Sales Reports API', () => {
  let mockSupabase: MockSupabaseClient
  let mockRequest: NextRequest

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock storage operations
    const mockStorageUpload = vi.fn()
    const mockStorageGetPublicUrl = vi.fn()
    const mockStorageRemove = vi.fn()
    const mockStorageFrom = vi.fn(() => ({
      upload: mockStorageUpload,
      getPublicUrl: mockStorageGetPublicUrl,
      remove: mockStorageRemove,
    }))

    // Create detailed mock structure with direct table mocking
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
      storage: {
        from: mockStorageFrom,
      },
    }

    vi.mocked(createClient).mockReturnValue(mockSupabase as MockSupabaseClient & Record<string, unknown>)
    vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase as MockSupabaseClient & Record<string, unknown>)
    vi.mocked(generalRateLimiter.checkLimit).mockReturnValue({ allowed: true })
    
    // Mock successful auth by default
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as MockAuthResponse)

    // Set up default table mocks
    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'test-user-id', role: 'employee', branch_id: 'branch-1' },
                error: null,
              })
            })
          })
        }
      }
      
      if (table === 'time_entries') {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                lt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: vi.fn().mockResolvedValue({
                        data: { branch_id: 'branch-2' }, // Latest check-in branch
                        error: null,
                      })
                    })
                  })
                })
              })
            })
          })
        }
      }
      
      if (table === 'sales_reports') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  })
                }),
                order: () => vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                })
              }),
              order: () => vi.fn().mockResolvedValue({
                data: [],
                error: null,
              })
            })
          }),
          insert: () => ({
            select: () => ({
              single: vi.fn()
            })
          })
        }
      }
      
      return {
        select: () => ({ eq: () => ({ single: vi.fn(), order: vi.fn(), gte: () => ({ lt: () => ({ order: () => ({ limit: () => ({ single: vi.fn() }) }) }) }) }) }),
        insert: () => ({ select: () => ({ single: vi.fn() }) })
      }
    })

    // Store references for individual test customization
    ;(mockSupabase as any).mockStorageUpload = mockStorageUpload
    ;(mockSupabase as any).mockStorageGetPublicUrl = mockStorageGetPublicUrl
    ;(mockSupabase as any).mockStorageRemove = mockStorageRemove
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/employee/sales-reports', () => {
    beforeEach(() => {
      mockRequest = {
        url: 'https://example.com/api/employee/sales-reports',
      } as NextRequest
    })

    it('should successfully get sales reports', async () => {
      // Override the default empty data for this test
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'test-user-id', role: 'employee', branch_id: 'branch-1' },
                  error: null,
                })
              })
            })
          }
        }
        
        if (table === 'sales_reports') {
          return {
            select: () => ({
              eq: () => ({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'report-1',
                      branch_id: 'branch-1',
                      user_id: 'test-user-id',
                      report_date: '2025-01-17',
                      total_sales: 5000.00,
                      slip_image_url: 'https://example.com/slip.jpg',
                      created_at: '2025-01-17T12:00:00Z',
                      branches: {
                        id: 'branch-1',
                        name: 'สาขาทดสอบ',
                        latitude: 13.7563,
                        longitude: 100.5018,
                      },
                    },
                  ],
                  error: null,
                })
              })
            })
          }
        }
        
        return { select: () => ({ eq: () => ({ single: vi.fn(), order: vi.fn() }) }) }
      })

      const response = await salesReportsGET(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toHaveLength(1)
      expect(responseData.data[0].total_sales).toBe(5000.00)
    })

    it('should filter reports by date when provided', async () => {
      mockRequest = {
        url: 'https://example.com/api/employee/sales-reports?report_date=2025-01-17',
      } as NextRequest

      // Override the default mock for this specific test
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'test-user-id', role: 'employee', branch_id: 'branch-1' },
                  error: null,
                })
              })
            })
          }
        }
        
        if (table === 'sales_reports') {
          return {
            select: () => ({
              eq: (field: string) => {
                if (field === 'user_id') {
                  return {
                    order: () => ({
                      eq: () => vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      })
                    })
                  }
                }
                return { order: () => vi.fn().mockResolvedValue({ data: [], error: null }) }
              }
            })
          }
        }
        
        return {
          select: () => ({ eq: () => ({ single: vi.fn(), order: vi.fn() }) }),
          insert: () => ({ select: () => ({ single: vi.fn() }) })
        }
      })

      const response = await salesReportsGET(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toHaveLength(0)
    })

    it('should reject non-employee users', async () => {
      // Mock admin user
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-user-id', role: 'admin' },
        error: null,
      })

      const response = await salesReportsGET(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('Employee access required')
    })

    it('should handle rate limiting', async () => {
      vi.mocked(generalRateLimiter.checkLimit).mockReturnValue({ allowed: false })

      const response = await salesReportsGET(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(429)
      expect(responseData.error).toBe('Rate limit exceeded')
    })

    it('should handle unauthorized requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const response = await salesReportsGET(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/employee/sales-reports', () => {
    let mockFormData: FormData

    beforeEach(() => {
      mockFormData = new FormData()
      mockFormData.append('total_sales', '1500.50')
      
      // Create a mock file
      const mockFile = new File(['mock image content'], 'slip.jpg', { type: 'image/jpeg' })
      mockFormData.append('slip_image', mockFile)

      mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as unknown as NextRequest
    })

    it('should successfully create sales report with file upload', async () => {
      // Mock no existing report (no duplicate)
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock successful file upload
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'test-user-id/2025-01-17/123456.jpg' },
        error: null,
      })

      // Mock get public URL
      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/slip.jpg' },
      })

      // Mock successful insert
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: {
          id: 'new-report-id',
          branch_id: 'branch-1',
          user_id: 'test-user-id',
          report_date: '2025-01-17',
          total_sales: 1500.50,
          slip_image_url: 'https://example.com/slip.jpg',
          created_at: '2025-01-17T12:00:00Z',
          branches: {
            id: 'branch-1',
            name: 'สาขาทดสอบ',
          },
        },
        error: null,
      })

      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.data.total_sales).toBe(1500.50)
      expect(responseData.message).toContain('บันทึกรายงานยอดขายสำเร็จ')
    })

    it('should reject duplicate reports for same date', async () => {
      // Mock existing report
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'existing-report-id' },
        error: null,
      })

      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('คุณได้ทำการรายงานยอดขายของวันนี้แล้ว')
    })

    it('should validate sales amount is positive', async () => {
      mockFormData.set('total_sales', '-100')
      
      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('ยอดขายต้องเป็นตัวเลขบวกเท่านั้น')
    })

    it('should validate sales amount maximum limit', async () => {
      mockFormData.set('total_sales', '99999999999.99')
      
      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('ยอดขายต้องเป็นตัวเลขบวกเท่านั้น และไม่เกิน 12 หลัก')
    })

    it('should validate required fields', async () => {
      mockFormData.delete('total_sales')
      
      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('ข้อมูลไม่ครบถ้วน')
    })

    it('should validate file type', async () => {
      const invalidFile = new File(['mock content'], 'document.pdf', { type: 'application/pdf' })
      mockFormData.set('slip_image', invalidFile)
      
      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
    })

    it('should validate file size', async () => {
      // Create a mock file that's too large (6MB)
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      mockFormData.set('slip_image', largeFile)
      
      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('ขนาดไฟล์เกิน 5MB')
    })

    it('should handle file upload error', async () => {
      // Mock no existing report
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock file upload error
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      })

      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toContain('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
    })

    it('should clean up uploaded file if database insert fails', async () => {
      // Mock no existing report
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock successful file upload
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'test-user-id/2025-01-17/123456.jpg' },
        error: null,
      })

      // Mock get public URL
      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/slip.jpg' },
      })

      // Mock database insert error
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      // Mock file removal
      const mockRemove = vi.fn().mockResolvedValue({ data: null, error: null })
      mockSupabase.storage.from().remove = mockRemove

      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toContain('เกิดข้อผิดพลาดในการบันทึกรายงานยอดขาย')
      expect(mockRemove).toHaveBeenCalled()
    })

    it('should require check-in before reporting', async () => {
      // Mock time_entries query with no check-in today
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'test-user-id', role: 'employee', branch_id: 'branch-1' },
                  error: null,
                })
              })
            })
          }
        }
        
        if (table === 'time_entries') {
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  lt: () => ({
                    order: () => ({
                      limit: () => ({
                        single: vi.fn().mockResolvedValue({
                          data: null,
                          error: { code: 'PGRST116' }, // No records found
                        })
                      })
                    })
                  })
                })
              })
            })
          }
        }
        
        return {
          select: () => ({ eq: () => ({ single: vi.fn(), order: vi.fn(), gte: () => ({ lt: () => ({ order: () => ({ limit: () => ({ single: vi.fn() }) }) }) }) }) }),
          insert: () => ({ select: () => ({ single: vi.fn() }) })
        }
      })

      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('กรุณาเช็คอินที่สาขาก่อนทำการรายงานยอดขาย')
    })

    it('should use latest check-in branch for multiple check-ins', async () => {
      // Mock time_entries query with latest check-in at branch-3
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'test-user-id', role: 'employee', branch_id: 'branch-1' },
                  error: null,
                })
              })
            })
          }
        }
        
        if (table === 'time_entries') {
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  lt: () => ({
                    order: () => ({
                      limit: () => ({
                        single: vi.fn().mockResolvedValue({
                          data: { branch_id: 'branch-3' }, // Latest check-in branch
                          error: null,
                        })
                      })
                    })
                  })
                })
              })
            })
          }
        }
        
        if (table === 'sales_reports') {
          const mockDuplicateCheck = vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // No duplicate
          })
          
          const mockInsert = vi.fn().mockResolvedValue({
            data: {
              id: 'new-report-id',
              branch_id: 'branch-3', // Should use check-in branch, not home branch
              user_id: 'test-user-id',
              report_date: '2025-01-17',
              total_sales: 1500.50,
              slip_image_url: 'https://example.com/slip.jpg',
              created_at: '2025-01-17T12:00:00Z',
              branches: {
                id: 'branch-3',
                name: 'สาขาเช็คอิน',
              },
            },
            error: null,
          })
          
          return {
            select: () => ({
              eq: (field: string, value: string) => {
                if (field === 'user_id') {
                  return {
                    eq: (field2: string, value2: string) => {
                      if (field2 === 'branch_id' && value2 === 'branch-3') {
                        return {
                          eq: () => ({
                            single: mockDuplicateCheck
                          })
                        }
                      }
                      return { eq: () => ({ single: mockDuplicateCheck }) }
                    }
                  }
                }
                return { eq: () => ({ single: mockDuplicateCheck }) }
              }
            }),
            insert: () => ({
              select: () => ({
                single: mockInsert
              })
            })
          }
        }
        
        return {
          select: () => ({ eq: () => ({ single: vi.fn(), order: vi.fn(), gte: () => ({ lt: () => ({ order: () => ({ limit: () => ({ single: vi.fn() }) }) }) }) }) }),
          insert: () => ({ select: () => ({ single: vi.fn() }) })
        }
      })

      // Mock successful file upload
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'test-user-id/2025-01-17/123456.jpg' },
        error: null,
      })

      // Mock get public URL
      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/slip.jpg' },
      })

      const response = await salesReportsPOST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.data.branch_id).toBe('branch-3') // Should use check-in branch
      expect(responseData.data.branches.name).toBe('สาขาเช็คอิน')
    })
  })
})
