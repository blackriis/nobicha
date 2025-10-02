import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddEmployeePage } from '@/components/admin/AddEmployeePage'
import { EditEmployeePage } from '@/components/admin/EditEmployeePage'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock services
const mockBranchService = {
  getBranches: vi.fn()
}

const mockEmployeeService = {
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  getEmployeeById: vi.fn()
}

vi.mock('@/lib/services/branch.service', () => ({
  branchService: mockBranchService
}))

vi.mock('@/lib/services/employee.service', () => ({
  employeeService: mockEmployeeService
}))

// Mock UI components
vi.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: ({ className }: any) => <div className={className} data-testid="loading-spinner">Loading...</div>
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div data-testid={`alert-${variant || 'default'}`}>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>
}))

// Mock icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle2: () => <div data-testid="check-circle-icon" />
}))

// Mock EmployeeForm to simplify testing
vi.mock('@/components/admin/EmployeeForm', () => ({
  EmployeeForm: ({ mode, initialData, branches, onSubmit, onCancel, isLoading }: any) => {
    const handleSubmit = async () => {
      const formData = mode === 'create' 
        ? {
            full_name: 'Test Employee',
            email: 'test@example.com',
            password: 'TestPassword123',
            home_branch_id: 'branch-1',
            hourly_rate: 50,
            daily_rate: 400,
            user_role: 'employee',
            is_active: true
          }
        : {
            full_name: 'Updated Employee',
            home_branch_id: 'branch-2',
            hourly_rate: 60,
            daily_rate: 480,
            is_active: true
          }
      
      await onSubmit(formData)
    }

    return (
      <div data-testid="employee-form">
        <h2>{mode === 'create' ? 'เพิ่มพนักงานใหม่' : 'แก้ไขข้อมูลพนักงาน'}</h2>
        <div>Branches: {branches.length}</div>
        {initialData && <div>Employee: {initialData.full_name}</div>}
        <button onClick={handleSubmit} disabled={isLoading}>
          {mode === 'create' ? 'สร้างพนักงาน' : 'บันทึกการแก้ไข'}
        </button>
        <button onClick={onCancel}>ยกเลิก</button>
      </div>
    )
  }
}))

const mockBranches = [
  { id: 'branch-1', name: 'สาขาหลัก', address: '123 ถนนหลัก กรุงเทพฯ' },
  { id: 'branch-2', name: 'สาขาย่อย', address: '456 ถนนรอง นนทบุรี' }
]

const mockEmployeeData = {
  id: 'employee-1',
  email: 'existing@example.com',
  full_name: 'Existing Employee',
  role: 'employee' as const,
  home_branch_id: 'branch-1',
  hourly_rate: 50,
  daily_rate: 400,
  is_active: true,
  created_at: '2025-01-17T00:00:00Z',
  branch_name: 'สาขาหลัก',
  branch_address: '123 ถนนหลัก กรุงเทพฯ'
}

describe('Employee Form Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBranchService.getBranches.mockResolvedValue(mockBranches)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Add Employee Workflow', () => {
    it('should complete full create employee workflow successfully', async () => {
      const user = userEvent.setup()
      
      // Mock successful employee creation
      mockEmployeeService.createEmployee.mockResolvedValue({
        success: true,
        employee: {
          id: 'new-employee-id',
          email: 'test@example.com',
          full_name: 'Test Employee',
          role: 'employee',
          home_branch_id: 'branch-1',
          hourly_rate: 50,
          daily_rate: 400,
          is_active: true,
          created_at: '2025-01-17T00:00:00Z'
        }
      })

      render(<AddEmployeePage />)

      // Wait for branches to load
      await waitFor(() => {
        expect(screen.getByTestId('employee-form')).toBeInTheDocument()
      })

      // Verify form is rendered with correct data
      expect(screen.getByText('เพิ่มพนักงานใหม่')).toBeInTheDocument()
      expect(screen.getByText('Branches: 2')).toBeInTheDocument()

      // Submit the form
      await user.click(screen.getByText('สร้างพนักงาน'))

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByTestId('alert-default')).toBeInTheDocument()
      })

      expect(screen.getByText('สร้างพนักงาน "Test Employee" เรียบร้อยแล้ว')).toBeInTheDocument()
      expect(screen.getByText('กำลังนำท่านกลับไปหน้ารายการพนักงาน...')).toBeInTheDocument()

      // Verify service calls
      expect(mockBranchService.getBranches).toHaveBeenCalledTimes(1)
      expect(mockEmployeeService.createEmployee).toHaveBeenCalledWith({
        full_name: 'Test Employee',
        email: 'test@example.com',
        password: 'TestPassword123',
        home_branch_id: 'branch-1',
        hourly_rate: 50,
        daily_rate: 400,
        user_role: 'employee',
        is_active: true
      })

      // Should redirect after 2 seconds (we'll check the timer was set)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/employees')
      }, { timeout: 3000 })
    })

    it('should handle create employee error gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock failed employee creation
      mockEmployeeService.createEmployee.mockResolvedValue({
        success: false,
        error: 'อีเมลนี้มีอยู่ในระบบแล้ว'
      })

      render(<AddEmployeePage />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByTestId('employee-form')).toBeInTheDocument()
      })

      // Submit the form
      await user.click(screen.getByText('สร้างพนักงาน'))

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByTestId('alert-destructive')).toBeInTheDocument()
      })

      expect(screen.getByText('อีเมลนี้มีอยู่ในระบบแล้ว')).toBeInTheDocument()

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle branch loading error', async () => {
      // Mock failed branch loading
      mockBranchService.getBranches.mockRejectedValue(new Error('Network error'))

      render(<AddEmployeePage />)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByTestId('alert-destructive')).toBeInTheDocument()
      })

      expect(screen.getByText('เกิดข้อผิดพลาดในการโหลดข้อมูลสาขา')).toBeInTheDocument()
      expect(screen.getByText('กลับไปหน้ารายการพนักงาน')).toBeInTheDocument()

      // Should not show form
      expect(screen.queryByTestId('employee-form')).not.toBeInTheDocument()
    })

    it('should handle empty branches list', async () => {
      // Mock empty branches
      mockBranchService.getBranches.mockResolvedValue([])

      render(<AddEmployeePage />)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByTestId('alert-destructive')).toBeInTheDocument()
      })

      expect(screen.getByText('ไม่พบข้อมูลสาขา กรุณาเพิ่มสาขาก่อนสร้างพนักงาน')).toBeInTheDocument()
    })

    it('should navigate back when cancel is clicked', async () => {
      const user = userEvent.setup()

      render(<AddEmployeePage />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByTestId('employee-form')).toBeInTheDocument()
      })

      // Click cancel
      await user.click(screen.getByText('ยกเลิก'))

      expect(mockPush).toHaveBeenCalledWith('/admin/employees')
    })
  })

  describe('Edit Employee Workflow', () => {
    it('should complete full edit employee workflow successfully', async () => {
      const user = userEvent.setup()
      
      // Mock successful data loading
      mockEmployeeService.getEmployeeById.mockResolvedValue(mockEmployeeData)
      
      // Mock successful employee update
      mockEmployeeService.updateEmployee.mockResolvedValue({
        success: true,
        employee: {
          ...mockEmployeeData,
          full_name: 'Updated Employee',
          hourly_rate: 60,
          daily_rate: 480
        }
      })

      render(<EditEmployeePage employeeId="employee-1" />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('employee-form')).toBeInTheDocument()
      })

      // Verify form is rendered with correct data
      expect(screen.getByText('แก้ไขข้อมูลพนักงาน')).toBeInTheDocument()
      expect(screen.getByText('Employee: Existing Employee')).toBeInTheDocument()
      expect(screen.getByText('Branches: 2')).toBeInTheDocument()

      // Submit the form
      await user.click(screen.getByText('บันทึกการแก้ไข'))

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByTestId('alert-default')).toBeInTheDocument()
      })

      expect(screen.getByText('แก้ไขข้อมูลพนักงาน "Updated Employee" เรียบร้อยแล้ว')).toBeInTheDocument()

      // Verify service calls
      expect(mockEmployeeService.getEmployeeById).toHaveBeenCalledWith('employee-1')
      expect(mockBranchService.getBranches).toHaveBeenCalledTimes(1)
      expect(mockEmployeeService.updateEmployee).toHaveBeenCalledWith('employee-1', {
        full_name: 'Updated Employee',
        home_branch_id: 'branch-2',
        hourly_rate: 60,
        daily_rate: 480,
        is_active: true
      })

      // Should redirect after success
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/employees')
      }, { timeout: 3000 })
    })

    it('should handle edit employee error gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock successful data loading
      mockEmployeeService.getEmployeeById.mockResolvedValue(mockEmployeeData)
      
      // Mock failed employee update
      mockEmployeeService.updateEmployee.mockResolvedValue({
        success: false,
        error: 'ไม่พบสาขาที่เลือก'
      })

      render(<EditEmployeePage employeeId="employee-1" />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByTestId('employee-form')).toBeInTheDocument()
      })

      // Submit the form
      await user.click(screen.getByText('บันทึกการแก้ไข'))

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByTestId('alert-destructive')).toBeInTheDocument()
      })

      expect(screen.getByText('ไม่พบสาขาที่เลือก')).toBeInTheDocument()

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle employee not found', async () => {
      // Mock employee not found
      mockEmployeeService.getEmployeeById.mockRejectedValue(new Error('Employee not found'))

      render(<EditEmployeePage employeeId="non-existent" />)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByTestId('alert-destructive')).toBeInTheDocument()
      })

      expect(screen.getByText('ไม่พบข้อมูลพนักงานรายการนี้')).toBeInTheDocument()
      expect(screen.getByText('กลับไปหน้ารายการพนักงาน')).toBeInTheDocument()

      // Should not show form
      expect(screen.queryByTestId('employee-form')).not.toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      // Mock delayed loading
      mockEmployeeService.getEmployeeById.mockReturnValue(new Promise(() => {}))

      render(<EditEmployeePage employeeId="employee-1" />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('กำลังโหลดข้อมูลพนักงาน...')).toBeInTheDocument()
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should show correct breadcrumbs in add page', async () => {
      render(<AddEmployeePage />)

      await waitFor(() => {
        expect(screen.getByText('หน้าแรก')).toBeInTheDocument()
      })

      expect(screen.getByText('จัดการพนักงาน')).toBeInTheDocument()
      expect(screen.getByText('เพิ่มพนักงานใหม่')).toBeInTheDocument()
    })

    it('should show correct breadcrumbs in edit page', async () => {
      mockEmployeeService.getEmployeeById.mockResolvedValue(mockEmployeeData)

      render(<EditEmployeePage employeeId="employee-1" />)

      await waitFor(() => {
        expect(screen.getByText('หน้าแรก')).toBeInTheDocument()
      })

      expect(screen.getByText('จัดการพนักงาน')).toBeInTheDocument()
      expect(screen.getByText('แก้ไขพนักงาน')).toBeInTheDocument()
    })
  })
})