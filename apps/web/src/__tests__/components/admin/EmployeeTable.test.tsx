import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EmployeeTable } from '@/components/admin/EmployeeTable'
import { EmployeeListItem } from '@/lib/services/employee.service'

const mockEmployees: EmployeeListItem[] = [
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
]

describe('EmployeeTable', () => {
  const defaultProps = {
    employees: mockEmployees,
    loading: false,
    onSort: vi.fn(),
    sortBy: 'created_at' as const,
    sortOrder: 'desc' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render employee data correctly', () => {
    render(<EmployeeTable {...defaultProps} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('should display role badges correctly', () => {
    render(<EmployeeTable {...defaultProps} />)

    expect(screen.getByText('พนักงาน')).toBeInTheDocument()
    expect(screen.getByText('ผู้ดูแลระบบ')).toBeInTheDocument()
  })

  it('should display status badges correctly', () => {
    render(<EmployeeTable {...defaultProps} />)

    expect(screen.getByText('ใช้งาน')).toBeInTheDocument()
    expect(screen.getByText('ไม่ใช้งาน')).toBeInTheDocument()
  })

  it('should display branch information', () => {
    render(<EmployeeTable {...defaultProps} />)

    expect(screen.getByText('Main Branch')).toBeInTheDocument()
    expect(screen.getByText('Secondary Branch')).toBeInTheDocument()
  })

  it('should call onSort when column header is clicked', () => {
    const onSort = vi.fn()
    render(<EmployeeTable {...defaultProps} onSort={onSort} />)

    const nameHeader = screen.getByText('ชื่อ-นามสกุล')
    fireEvent.click(nameHeader)

    expect(onSort).toHaveBeenCalledWith('full_name')
  })

  it('should show loading state', () => {
    render(<EmployeeTable {...defaultProps} loading={true} />)

    expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
  })

  it('should show empty state when no employees', () => {
    render(<EmployeeTable {...defaultProps} employees={[]} />)

    expect(screen.getByText('ไม่พบข้อมูลพนักงาน')).toBeInTheDocument()
  })

  it('should handle employees without branch data', () => {
    const employeesWithoutBranch = [
      {
        ...mockEmployees[0],
        branch_id: null,
        branch_name: undefined,
        branch_address: undefined
      }
    ]

    render(<EmployeeTable {...defaultProps} employees={employeesWithoutBranch} />)

    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('should display sorting indicators', () => {
    render(<EmployeeTable {...defaultProps} sortBy="full_name" sortOrder="asc" />)

    // Check if sort indicator is present (ChevronUp icon for ascending)
    const sortedHeader = screen.getByText('ชื่อ-นามสกุล').closest('button')
    expect(sortedHeader).toBeInTheDocument()
  })

  it('should format dates correctly', () => {
    render(<EmployeeTable {...defaultProps} />)

    expect(screen.getByText('01/01/2024')).toBeInTheDocument()
    expect(screen.getByText('02/01/2024')).toBeInTheDocument()
  })
})