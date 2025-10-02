import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmployeeListPage } from '@/components/admin/EmployeeListPage'

// Mock the auth provider
const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com'
}

const mockSession = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token'
}

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ 
    user: mockUser,
    session: mockSession
  })
}))

// Mock fetch
global.fetch = vi.fn()

// Mock branch service
vi.mock('@/lib/services/branch.service', () => ({
  BranchService: vi.fn().mockImplementation(() => ({
    getBranchList: vi.fn().mockResolvedValue({
      data: [
        { id: 'branch-1', name: 'Main Branch', address: '123 Main St' },
        { id: 'branch-2', name: 'Secondary Branch', address: '456 Oak Ave' }
      ],
      total: 2
    })
  }))
}))

const mockEmployeesResponse = {
  success: true,
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
    },
    {
      id: 'emp-2',
      email: 'jane@example.com',
      full_name: 'Jane Smith',
      role: 'admin',
      branch_id: 'branch-2',
      is_active: false,
      created_at: '2024-01-02T00:00:00Z',
      branch_name: 'Secondary Branch',
      branch_address: '456 Oak Ave'
    }
  ],
  total: 2,
  page: 1,
  limit: 20
}

describe('Employee Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEmployeesResponse)
    })
  })

  it('should load and display employee data on mount', async () => {
    render(<EmployeeListPage />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/employees'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    )
  })

  it('should handle search functionality', async () => {
    render(<EmployeeListPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Perform search
    const searchInput = screen.getByPlaceholderText('ค้นหาพนักงาน...')
    fireEvent.change(searchInput, { target: { value: 'john' } })

    // Wait for debounced search
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=john'),
        expect.any(Object)
      )
    }, { timeout: 500 })
  })

  it('should handle role filtering', async () => {
    render(<EmployeeListPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Apply role filter
    const roleSelect = screen.getByDisplayValue('ทุกบทบาท')
    fireEvent.change(roleSelect, { target: { value: 'admin' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('role=admin'),
        expect.any(Object)
      )
    })
  })

  it('should handle status filtering', async () => {
    render(<EmployeeListPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Apply status filter
    const statusSelect = screen.getByDisplayValue('ทุกสถานะ')
    fireEvent.change(statusSelect, { target: { value: 'active' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      )
    })
  })

  it('should handle pagination', async () => {
    render(<EmployeeListPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click next page
    const nextButton = screen.getByText('ถัดไป')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      )
    })
  })

  it('should handle sorting', async () => {
    render(<EmployeeListPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click name column to sort
    const nameHeader = screen.getByText('ชื่อ-นามสกุล')
    fireEvent.click(nameHeader)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=full_name&sortOrder=asc'),
        expect.any(Object)
      )
    })
  })

  it('should handle API errors gracefully', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' })
    })

    render(<EmployeeListPage />)

    await waitFor(() => {
      expect(screen.getByText('เกิดข้อผิดพลาด: Server error')).toBeInTheDocument()
    })
  })

  it('should show loading state during API calls', () => {
    ;(global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(<EmployeeListPage />)

    expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
  })

  it('should reset pagination when filters change', async () => {
    render(<EmployeeListPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Navigate to page 2 first
    const nextButton = screen.getByText('ถัดไป')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      )
    })

    // Apply a filter
    const roleSelect = screen.getByDisplayValue('ทุกบทบาท')
    fireEvent.change(roleSelect, { target: { value: 'admin' } })

    // Should reset to page 1
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&'),
        expect.any(Object)
      )
    })
  })

  it('should handle items per page change', async () => {
    render(<EmployeeListPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Change items per page
    const sizeSelect = screen.getByDisplayValue('20')
    fireEvent.change(sizeSelect, { target: { value: '50' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      )
    })
  })

  it('should clear filters correctly', async () => {
    render(<EmployeeListPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Apply filters
    const roleSelect = screen.getByDisplayValue('ทุกบทบาท')
    fireEvent.change(roleSelect, { target: { value: 'admin' } })

    const statusSelect = screen.getByDisplayValue('ทุกสถานะ')
    fireEvent.change(statusSelect, { target: { value: 'active' } })

    await waitFor(() => {
      expect(screen.getByText('ล้างตัวกรอง')).toBeInTheDocument()
    })

    // Clear filters
    const clearButton = screen.getByText('ล้างตัวกรอง')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('role='),
        expect.any(Object)
      )
    })
  })
})