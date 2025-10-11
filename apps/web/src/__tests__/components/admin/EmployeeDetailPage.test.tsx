import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { EmployeeDetailPage } from '@/components/admin/EmployeeDetailPage'
import { employeeService } from '@/lib/services/employee.service'

// Mock the employee service
vi.mock('@/lib/services/employee.service', () => ({
 employeeService: {
  getEmployeeById: vi.fn()
 }
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
 useRouter: () => ({
  push: vi.fn(),
  back: vi.fn()
 })
}))

// Mock TimeEntryList component
vi.mock('@/components/admin/TimeEntryList', () => ({
 TimeEntryList: ({ employeeId }: { employeeId: string }) => (
  <div data-testid="time-entry-list">TimeEntryList for {employeeId}</div>
 )
}))

const mockEmployeeData = {
 id: 'test-employee-id',
 full_name: 'John Doe',
 email: 'john.doe@example.com',
 branch_name: 'Main Branch',
 role: 'employee',
 is_active: true,
 created_at: '2024-01-01T00:00:00Z'
}

describe('EmployeeDetailPage', () => {
 beforeEach(() => {
  vi.clearAllMocks()
 })

 it('should render loading state initially', () => {
  vi.mocked(employeeService.getEmployeeById).mockImplementation(() => new Promise(() => {}))
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  expect(screen.getByText('กำลังโหลดข้อมูลพนักงาน...')).toBeInTheDocument()
 })

 it('should render employee data when loaded successfully', async () => {
  vi.mocked(employeeService.getEmployeeById).mockResolvedValue(mockEmployeeData)
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('John Doe')).toBeInTheDocument()
   expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
   expect(screen.getByText('Main Branch')).toBeInTheDocument()
   expect(screen.getByText('ใช้งานอยู่')).toBeInTheDocument()
   expect(screen.getByText('พนักงาน')).toBeInTheDocument()
  })
 })

 it('should render error state when API fails', async () => {
  vi.mocked(employeeService.getEmployeeById).mockRejectedValue(new Error('API Error'))
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('API Error')).toBeInTheDocument()
   expect(screen.getByText('ลองใหม่')).toBeInTheDocument()
  })
 })

 it('should render TimeEntryList component', async () => {
  vi.mocked(employeeService.getEmployeeById).mockResolvedValue(mockEmployeeData)
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByTestId('time-entry-list')).toBeInTheDocument()
  })
 })

 it('should render back button', async () => {
  vi.mocked(employeeService.getEmployeeById).mockResolvedValue(mockEmployeeData)
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('กลับ')).toBeInTheDocument()
  })
 })

 it('should render edit button', async () => {
  vi.mocked(employeeService.getEmployeeById).mockResolvedValue(mockEmployeeData)
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('แก้ไขข้อมูล')).toBeInTheDocument()
  })
 })

 it('should display correct page title', async () => {
  vi.mocked(employeeService.getEmployeeById).mockResolvedValue(mockEmployeeData)
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('รายละเอียดพนักงาน')).toBeInTheDocument()
   expect(screen.getByText('ข้อมูลพนักงานและการมาทำงาน')).toBeInTheDocument()
  })
 })

 it('should display correct section titles', async () => {
  vi.mocked(employeeService.getEmployeeById).mockResolvedValue(mockEmployeeData)
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('ข้อมูลพนักงาน')).toBeInTheDocument()
   expect(screen.getByText('ประวัติการมาทำงาน')).toBeInTheDocument()
  })
 })

 it('should handle employee without branch data', async () => {
  const employeeWithoutBranch = { ...mockEmployeeData, branch_name: null }
  vi.mocked(employeeService.getEmployeeById).mockResolvedValue(employeeWithoutBranch)
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('ไม่ระบุ')).toBeInTheDocument()
  })
 })

 it('should display admin role badge correctly', async () => {
  const adminEmployee = { ...mockEmployeeData, role: 'admin' }
  vi.mocked(employeeService.getEmployeeById).mockResolvedValue(adminEmployee)
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('ผู้ดูแลระบบ')).toBeInTheDocument()
  })
 })

 it('should display inactive status badge correctly', async () => {
  const inactiveEmployee = { ...mockEmployeeData, is_active: false }
  vi.mocked(employeeService.getEmployeeById).mockResolvedValue(inactiveEmployee)
  
  render(<EmployeeDetailPage employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('ไม่ใช้งาน')).toBeInTheDocument()
  })
 })
})
