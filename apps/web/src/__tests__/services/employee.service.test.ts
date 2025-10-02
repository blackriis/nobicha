import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmployeeService } from '@/lib/services/employee.service'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn()
  }))
}))

const mockSupabaseClient = {
  from: vi.fn()
}

describe('EmployeeService', () => {
  let employeeService: EmployeeService
  let mockQuery: any

  beforeEach(() => {
    vi.clearAllMocks()
    employeeService = new EmployeeService('mock-url', 'mock-key')
    
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis()
    }
    
    mockSupabaseClient.from.mockReturnValue(mockQuery)
  })

  describe('getEmployeeList', () => {
    it('should fetch employees successfully', async () => {
      const mockData = [
        {
          id: 'emp-1',
          email: 'john@example.com',
          full_name: 'John Doe',
          role: 'employee',
          branch_id: 'branch-1',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          branches: {
            id: 'branch-1',
            name: 'Main Branch',
            address: '123 Main St'
          }
        }
      ]

      mockQuery.select.mockReturnValue({
        ...mockQuery,
        exec: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
          count: 1
        })
      })

      const result = await employeeService.getEmployeeList()

      expect(result).toEqual({
        data: [
          {
            id: 'emp-1',
            email: 'john@example.com',
            full_name: 'John Doe',
            role: 'employee',
            branch_id: 'branch-1',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            branch_name: 'Main Branch',
            branch_address: '123 Main St'
          }
        ],
        total: 1,
        page: 1,
        limit: 20
      })
    })

    it('should apply search filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await employeeService.getEmployeeList(
        { search: 'john' },
        { page: 1, limit: 20 }
      )

      expect(mockQuery.or).toHaveBeenCalledWith(
        'full_name.ilike.%john%,email.ilike.%john%'
      )
    })

    it('should apply branch filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await employeeService.getEmployeeList(
        { branchId: 'branch-1' },
        { page: 1, limit: 20 }
      )

      expect(mockQuery.eq).toHaveBeenCalledWith('branch_id', 'branch-1')
    })

    it('should apply role filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await employeeService.getEmployeeList(
        { role: 'admin' },
        { page: 1, limit: 20 }
      )

      expect(mockQuery.eq).toHaveBeenCalledWith('role', 'admin')
    })

    it('should apply status filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await employeeService.getEmployeeList(
        { status: 'active' },
        { page: 1, limit: 20 }
      )

      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('should apply inactive status filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await employeeService.getEmployeeList(
        { status: 'inactive' },
        { page: 1, limit: 20 }
      )

      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', false)
    })

    it('should apply sorting', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await employeeService.getEmployeeList(
        { sortBy: 'full_name', sortOrder: 'asc' },
        { page: 1, limit: 20 }
      )

      expect(mockQuery.order).toHaveBeenCalledWith('full_name', { ascending: true })
    })

    it('should apply pagination', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await employeeService.getEmployeeList(
        {},
        { page: 3, limit: 10 }
      )

      expect(mockQuery.range).toHaveBeenCalledWith(20, 29) // (page-1)*limit to (page*limit-1)
    })

    it('should handle API errors', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null
      })

      await expect(employeeService.getEmployeeList()).rejects.toThrow(
        'Failed to fetch employees: Database error'
      )
    })

    it('should handle empty branch data', async () => {
      const mockData = [
        {
          id: 'emp-1',
          email: 'john@example.com',
          full_name: 'John Doe',
          role: 'employee',
          branch_id: null,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          branches: null
        }
      ]

      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1
      })

      const result = await employeeService.getEmployeeList()

      expect(result.data[0].branch_name).toBeUndefined()
      expect(result.data[0].branch_address).toBeUndefined()
    })
  })

  describe('applySorting', () => {
    const mockEmployees = [
      {
        id: '1',
        full_name: 'Charlie Brown',
        email: 'charlie@example.com',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        full_name: 'Alice Smith',
        email: 'alice@example.com',
        created_at: '2024-01-02T00:00:00Z'
      },
      {
        id: '3',
        full_name: 'Bob Johnson',
        email: 'bob@example.com',
        created_at: '2024-01-03T00:00:00Z'
      }
    ] as any

    it('should sort by name ascending', () => {
      const result = employeeService.applySorting(mockEmployees, 'full_name', 'asc')
      
      expect(result[0].full_name).toBe('Alice Smith')
      expect(result[1].full_name).toBe('Bob Johnson')
      expect(result[2].full_name).toBe('Charlie Brown')
    })

    it('should sort by name descending', () => {
      const result = employeeService.applySorting(mockEmployees, 'full_name', 'desc')
      
      expect(result[0].full_name).toBe('Charlie Brown')
      expect(result[1].full_name).toBe('Bob Johnson')
      expect(result[2].full_name).toBe('Alice Smith')
    })

    it('should sort by date ascending', () => {
      const result = employeeService.applySorting(mockEmployees, 'created_at', 'asc')
      
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('3')
    })

    it('should sort by date descending', () => {
      const result = employeeService.applySorting(mockEmployees, 'created_at', 'desc')
      
      expect(result[0].id).toBe('3')
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('1')
    })

    it('should return original array if no sortBy provided', () => {
      const result = employeeService.applySorting(mockEmployees, undefined, 'asc')
      expect(result).toBe(mockEmployees)
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      const mockFn = vi.fn()
      const debouncedFn = employeeService.debounce(mockFn, 100)

      debouncedFn('test1')
      debouncedFn('test2')
      debouncedFn('test3')

      // Only the last call should execute after delay
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1)
        expect(mockFn).toHaveBeenCalledWith('test3')
        done()
      }, 150)
    })
  })
})