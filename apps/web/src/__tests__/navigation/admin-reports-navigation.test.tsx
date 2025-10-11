import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { EmployeeReportsSection } from '@/components/admin/reports/EmployeeReportsSection'

// Mock Next.js router
vi.mock('next/navigation', () => ({
 useRouter: vi.fn()
}))

describe('Admin Reports - Employee Details Navigation', () => {
 const mockPush = vi.fn()
 const mockEmployeeData = {
  summary: {
   totalEmployees: 5,
   totalHours: 120,
   activeEmployees: 3,
   averageHoursPerEmployee: 24
  },
  employees: [
   {
    userId: '1',
    employeeId: 'EMP001',
    fullName: 'John Doe',
    status: 'working',
    totalHours: 40,
    averageHoursPerSession: 8,
    totalSessions: 5,
    branches: ['Branch A', 'Branch B']
   },
   {
    userId: '2',
    employeeId: 'EMP002',
    fullName: 'Jane Smith',
    status: 'offline',
    totalHours: 35,
    averageHoursPerSession: 7,
    totalSessions: 5,
    branches: ['Branch A']
   }
  ],
  dateRange: { type: 'all' }
 }

 beforeEach(async () => {
  const { useRouter } = await import('next/navigation')
  vi.mocked(useRouter).mockReturnValue({
   push: mockPush,
   replace: vi.fn(),
   back: vi.fn(),
   forward: vi.fn(),
   refresh: vi.fn(),
   prefetch: vi.fn()
  })
  mockPush.mockClear()
 })

 it('should render employee reports section with view details button', () => {
  const mockOnViewDetails = vi.fn()
  
  render(
   <EmployeeReportsSection 
    data={mockEmployeeData}
    isLoading={false}
    onViewDetails={mockOnViewDetails}
   />
  )

  // Check if the component renders
  expect(screen.getByText('รายงานพนักงาน')).toBeInTheDocument()
  expect(screen.getByText('ดูรายละเอียด')).toBeInTheDocument()
  
  // Check if employee data is displayed
  expect(screen.getByText('John Doe')).toBeInTheDocument()
  expect(screen.getByText('Jane Smith')).toBeInTheDocument()
 })

 it('should call onViewDetails when "ดูรายละเอียด" button is clicked', () => {
  const mockOnViewDetails = vi.fn()
  
  render(
   <EmployeeReportsSection 
    data={mockEmployeeData}
    isLoading={false}
    onViewDetails={mockOnViewDetails}
   />
  )

  // Click the "ดูรายละเอียด" button
  const viewDetailsButton = screen.getByText('ดูรายละเอียด')
  fireEvent.click(viewDetailsButton)

  // Verify the callback was called
  expect(mockOnViewDetails).toHaveBeenCalledTimes(1)
 })

 it('should call onViewDetails when "ดูพนักงานทั้งหมด" button is clicked for many employees', () => {
  const mockOnViewDetails = vi.fn()
  
  // Create data with more than 10 employees
  const manyEmployeesData = {
   ...mockEmployeeData,
   employees: Array.from({ length: 15 }, (_, i) => ({
    userId: `${i + 1}`,
    employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
    fullName: `Employee ${i + 1}`,
    status: 'working',
    totalHours: 40,
    averageHoursPerSession: 8,
    totalSessions: 5,
    branches: ['Branch A']
   }))
  }
  
  render(
   <EmployeeReportsSection 
    data={manyEmployeesData}
    isLoading={false}
    onViewDetails={mockOnViewDetails}
   />
  )

  // Should show "ดูพนักงานทั้งหมด" button for more than 10 employees
  const viewAllButton = screen.getByText(/ดูพนักงานทั้งหมด \(15 คน\)/)
  fireEvent.click(viewAllButton)

  // Verify the callback was called
  expect(mockOnViewDetails).toHaveBeenCalledTimes(1)
 })

 it('should display empty state when no employee data', () => {
  render(
   <EmployeeReportsSection 
    data={null}
    isLoading={false}
    onViewDetails={() => {}}
   />
  )

  expect(screen.getByText('ไม่มีข้อมูลพนักงานในช่วงเวลานี้')).toBeInTheDocument()
 })

 it('should display loading state', () => {
  render(
   <EmployeeReportsSection 
    data={null}
    isLoading={true}
    onViewDetails={() => {}}
   />
  )

  // Should show loading skeletons
  expect(document.querySelectorAll('.animate-pulse')).toHaveLength(6) // Header + 5 employee items
 })
})