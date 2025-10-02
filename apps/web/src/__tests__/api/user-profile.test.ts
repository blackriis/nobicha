import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/user/profile/route'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn()
      }))
    }))
  }))
}

// Mock createSupabaseServerClient
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: () => mockSupabase
}))

describe('/api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/user/profile', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const request = new NextRequest('https://example.com/api/user/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized - Please login first',
        code: 'AUTH_REQUIRED'
      })
    })

    it('should return 404 when user profile is not found', async () => {
      // Mock authenticated user but no profile
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com' 
          } 
        },
        error: null
      })

      // Mock profile not found
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      })

      const request = new NextRequest('https://example.com/api/user/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'User profile not found',
        message: 'User authenticated but profile not created yet',
        code: 'PROFILE_NOT_FOUND',
        userId: 'test-user-id'
      })
    })

    it('should return 500 when database error occurs', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com' 
          } 
        },
        error: null
      })

      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: 'DB_ERROR' }
            })
          })
        })
      })

      const request = new NextRequest('https://example.com/api/user/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to fetch user profile',
        code: 'DATABASE_ERROR'
      })
    })

    it('should return user profile when successful', async () => {
      const mockProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'employee',
        branch_id: 'branch-1',
        employee_id: 'EMP001',
        phone_number: '1234567890',
        hire_date: '2024-01-01',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com' 
          } 
        },
        error: null
      })

      // Mock successful profile fetch
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      })

      const request = new NextRequest('https://example.com/api/user/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        profile: mockProfile
      })
    })

    it('should handle unexpected errors gracefully', async () => {
      // Mock unexpected error
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('https://example.com/api/user/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      })
    })
  })
})
