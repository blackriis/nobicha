import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createClientComponentClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    }))
  })
}))

// Mock user cache
vi.mock('@/lib/user-cache', () => ({
  userCache: {
    get: vi.fn(() => null),
    set: vi.fn()
  }
}))

// Mock fetch
global.fetch = vi.fn()

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

// Import after mocks
import { getUserProfile } from '@/lib/auth'

describe('getUserProfile Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.warn = vi.fn()
    console.error = vi.fn()
  })

  afterEach(() => {
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
  })

  it('should handle 401 authentication error gracefully', async () => {
    // Mock 401 response
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({
        success: false,
        error: 'Unauthorized - Please login first',
        code: 'AUTH_REQUIRED'
      })
    })

    const result = await getUserProfile('test-user-id')

    expect(result).toBeNull()
    expect(console.warn).toHaveBeenCalledWith(
      'User not authenticated for profile fetch',
      {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      }
    )
  })

  it('should handle 404 profile not found error gracefully', async () => {
    // Mock 404 response
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({
        success: false,
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND',
        userId: 'test-user-id'
      })
    })

    const result = await getUserProfile('test-user-id')

    expect(result).toBeNull()
    expect(console.warn).toHaveBeenCalledWith(
      'User profile not found',
      {
        userId: 'test-user-id',
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found'
      }
    )
  })

  it('should handle 500 server error with structured error data', async () => {
    // Mock 500 response
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({
        success: false,
        error: 'Failed to fetch user profile',
        code: 'DATABASE_ERROR',
        details: 'Database connection failed'
      })
    })

    const result = await getUserProfile('test-user-id')

    expect(result).toBeNull()
    expect(console.error).toHaveBeenCalledWith(
      'Profile API error:',
      {
        status: 500,
        statusText: 'Internal Server Error',
        error: {
          success: false,
          error: 'Failed to fetch user profile',
          code: 'DATABASE_ERROR',
          details: 'Database connection failed'
        },
        userId: 'test-user-id'
      }
    )
  })

  it('should handle invalid JSON response gracefully', async () => {
    // Mock response with invalid JSON
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Invalid JSON'))
    })

    const result = await getUserProfile('test-user-id')

    expect(result).toBeNull()
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to parse error response as JSON:',
      expect.any(Error)
    )
    expect(console.error).toHaveBeenCalledWith(
      'Profile API error:',
      {
        status: 500,
        statusText: 'Internal Server Error',
        error: {
          message: 'Invalid error response format',
          rawStatus: 500,
          rawStatusText: 'Internal Server Error'
        },
        userId: 'test-user-id'
      }
    )
  })

  it('should handle successful response correctly', async () => {
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

    // Mock successful response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        profile: mockProfile
      })
    })

    const result = await getUserProfile('test-user-id')

    expect(result).toEqual(mockProfile)
  })

  it('should handle successful response with missing profile data', async () => {
    // Mock response with success: true but no profile
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        profile: null
      })
    })

    const result = await getUserProfile('test-user-id')

    expect(result).toBeNull()
    expect(console.warn).toHaveBeenCalledWith(
      'Profile API returned unsuccessful result:',
      {
        success: true,
        profile: null
      }
    )
  })

  it('should handle network errors gracefully', async () => {
    // Mock network error
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

    const result = await getUserProfile('test-user-id')

    expect(result).toBeNull()
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching user profile via API:',
      expect.any(Error)
    )
  })
})
