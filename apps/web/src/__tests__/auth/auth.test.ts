import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { auth, getUserProfile, isAdmin, isEmployee, getRedirectUrl } from '@/lib/auth'
import { createClientComponentClient } from '@/lib/supabase'
import { userCache } from '@/lib/user-cache'
import type { AuthUser } from '@/lib/auth'

// Mock types for Supabase client
interface MockSupabaseClient {
  auth: {
    signInWithPassword: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    getSession: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
    onAuthStateChange: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createClientComponentClient: vi.fn(),
}))

// Mock user cache
vi.mock('@/lib/user-cache', () => ({
  userCache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(),
}

const createClientComponentClientMock = createClientComponentClient as MockedFunction<typeof createClientComponentClient>

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClientComponentClientMock.mockReturnValue(mockSupabase as MockSupabaseClient & Record<string, unknown>)
  })

  describe('auth.signIn', () => {
    it('signs in user with email and password', async () => {
      const mockAuthData = {
        user: { id: '1', email: 'test@example.com' },
        session: { access_token: 'token' }
      }
      const mockProfile = {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'employee' as const
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      // Mock the database query chain
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      const mockEq = vi.fn(() => ({ single: mockSingle }))
      const mockSelect = vi.fn(() => ({ eq: mockEq }))
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await auth.signIn('test@example.com', 'SecurePass123!')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123!'
      })

      expect(result.user).toEqual({
        ...mockAuthData.user,
        profile: mockProfile
      })
    })

    it('throws error on failed sign in', async () => {
      const errorMessage = 'Invalid credentials'
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error(errorMessage)
      })

      await expect(auth.signIn('wrong@example.com', 'wrong'))
        .rejects
        .toThrow()
    })
  })

  describe('auth.signUp', () => {
    it('signs up user with email, password, and role', async () => {
      const mockData = {
        user: { id: '1', email: 'new@example.com' },
        session: null
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await auth.signUp('new@example.com', 'SecurePass123!', 'John Doe', 'admin')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'SecurePass123!',
        options: {
          data: {
            full_name: 'John Doe',
            role: 'admin'
          }
        }
      })

      expect(result).toEqual(mockData)
    })
  })

  describe('auth.signOut', () => {
    it('signs out user successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      await expect(auth.signOut()).resolves.toBeUndefined()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('throws error on failed sign out', async () => {
      const errorMessage = 'Sign out failed'
      mockSupabase.auth.signOut.mockResolvedValue({
        error: new Error(errorMessage)
      })

      await expect(auth.signOut()).rejects.toThrow(errorMessage)
    })
  })

  describe('getUserProfile', () => {
    beforeEach(() => {
      // Clear user cache before each test
      userCache.clear()
    })
    
    it('fetches user profile successfully', async () => {
      const mockProfile = {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'employee' as const
      }

      // Mock the database query chain
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      const mockEq = vi.fn(() => ({ single: mockSingle }))
      const mockSelect = vi.fn(() => ({ eq: mockEq }))
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getUserProfile('1')

      expect(result).toEqual(mockProfile)
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('returns null on error', async () => {
      // Mock the database query chain for error case  
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('User not found') })
      const mockEq = vi.fn(() => ({ single: mockSingle }))
      const mockSelect = vi.fn(() => ({ eq: mockEq }))
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await getUserProfile('1')
      expect(result).toBeNull()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Role checking functions', () => {
    it('isAdmin returns true for admin user', () => {
      const adminUser: AuthUser = {
        id: '1',
        email: 'admin@test.com',
        profile: {
          id: '1',
          email: 'admin@test.com',
          full_name: 'Admin User',
          role: 'admin',
          branch_id: undefined,
          employee_id: undefined,
          phone_number: undefined,
          hire_date: undefined,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z'
        },
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00Z'
      }

      expect(isAdmin(adminUser)).toBe(true)
      expect(isEmployee(adminUser)).toBe(false)
    })

    it('isEmployee returns true for employee user', () => {
      const employeeUser: AuthUser = {
        id: '1',
        email: 'employee@test.com',
        profile: {
          id: '1',
          email: 'employee@test.com',
          full_name: 'Employee User',
          role: 'employee',
          branch_id: undefined,
          employee_id: undefined,
          phone_number: undefined,
          hire_date: undefined,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z'
        },
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00Z'
      }

      expect(isEmployee(employeeUser)).toBe(true)
      expect(isAdmin(employeeUser)).toBe(false)
    })

    it('returns false for null user', () => {
      expect(isAdmin(null)).toBe(false)
      expect(isEmployee(null)).toBe(false)
    })
  })

  describe('getRedirectUrl', () => {
    it('returns correct URLs for different roles', () => {
      expect(getRedirectUrl('admin')).toBe('/admin')
      expect(getRedirectUrl('employee')).toBe('/dashboard')
    })
  })
})