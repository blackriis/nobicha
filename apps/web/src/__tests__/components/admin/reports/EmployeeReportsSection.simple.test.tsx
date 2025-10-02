import { render, screen, fireEvent } from '@testing-library/react'
import { EmployeeReportsSection } from '@/components/admin/reports/EmployeeReportsSection'

describe('EmployeeReportsSection', () => {
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

  it('should render employee reports section with data', () => {
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
    
    // Check summary data
    expect(screen.getByText('5')).toBeInTheDocument() // totalEmployees
    expect(screen.getByText('120')).toBeInTheDocument() // totalHours
    expect(screen.getByText('3')).toBeInTheDocument() // activeEmployees
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

    // Should show loading skeletons (check for animate-pulse class)
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('should show employee status badges correctly', () => {
    render(
      <EmployeeReportsSection 
        data={mockEmployeeData}
        isLoading={false}
        onViewDetails={() => {}}
      />
    )

    // Check for status badges
    expect(screen.getByText('กำลังทำงาน')).toBeInTheDocument() // John Doe working status
    expect(screen.getByText('ออฟไลน์')).toBeInTheDocument() // Jane Smith offline status
  })

  it('should display employee hours correctly', () => {
    render(
      <EmployeeReportsSection 
        data={mockEmployeeData}
        isLoading={false}
        onViewDetails={() => {}}
      />
    )

    // Check for formatted hours display
    expect(screen.getByText('40 ชม. 0 นาที')).toBeInTheDocument() // John Doe total hours
    expect(screen.getByText('35 ชม. 0 นาที')).toBeInTheDocument() // Jane Smith total hours
  })
})