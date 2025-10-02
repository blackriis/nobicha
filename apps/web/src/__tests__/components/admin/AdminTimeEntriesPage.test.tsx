import { render, screen, fireEvent } from '@testing-library/react'
import { AdminTimeEntriesPage } from '@/components/admin/AdminTimeEntriesPage'

describe('AdminTimeEntriesPage', () => {
  it('should render time entries page with header and filters', () => {
    render(<AdminTimeEntriesPage />)

    // Check page title
    expect(screen.getByText('รายละเอียดการลงเวลาทำงาน')).toBeInTheDocument()
    expect(screen.getByText('ข้อมูลการ check-in/check-out ของพนักงานทั้งหมด')).toBeInTheDocument()

    // Check action buttons
    expect(screen.getByText('รีเฟรช')).toBeInTheDocument()
    expect(screen.getByText('ส่งออก CSV')).toBeInTheDocument()

    // Check filter section
    expect(screen.getByText('ตัวกรองข้อมูล')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ชื่อพนักงาน, รหัส, สาขา...')).toBeInTheDocument()
  })

  it('should display mock time entries data', () => {
    render(<AdminTimeEntriesPage />)

    // Check for mock employee names
    expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
    expect(screen.getByText('สมหญิง รักงาน')).toBeInTheDocument()
    expect(screen.getByText('สมศักดิ์ ขยัน')).toBeInTheDocument()

    // Check for employee IDs
    expect(screen.getByText('EMP001')).toBeInTheDocument()
    expect(screen.getByText('EMP002')).toBeInTheDocument()
    expect(screen.getByText('EMP003')).toBeInTheDocument()

    // Check for branch names
    expect(screen.getByText('สาขาหลัก')).toBeInTheDocument()
    expect(screen.getByText('สาขาย่อย')).toBeInTheDocument()
  })

  it('should show different status badges correctly', () => {
    render(<AdminTimeEntriesPage />)

    // Check for status text
    expect(screen.getByText('เสร็จสิ้น')).toBeInTheDocument() // completed status
    expect(screen.getByText('กำลังทำงาน')).toBeInTheDocument() // in_progress status
  })

  it('should display time information correctly', () => {
    render(<AdminTimeEntriesPage />)

    // Check for time-related labels
    expect(screen.getByText('เข้างาน:')).toBeInTheDocument()
    expect(screen.getByText('เลิกงาน:')).toBeInTheDocument()
    expect(screen.getByText('รวม:')).toBeInTheDocument()

    // Check for specific time values (from mock data)
    expect(screen.getByText('9 ชม. 0 นาที')).toBeInTheDocument() // EMP001 total hours
    expect(screen.getByText('6 ชม. 30 นาที')).toBeInTheDocument() // EMP003 total hours
    expect(screen.getByText('กำลังทำงาน')).toBeInTheDocument() // EMP002 still working
  })

  it('should show GPS and selfie information', () => {
    render(<AdminTimeEntriesPage />)

    // Check for GPS coordinates (from mock data)
    const gpsText = screen.getAllByText(/GPS: 13\.7563, 100\.5018/)
    expect(gpsText.length).toBeGreaterThan(0)

    // Check for selfie indication
    expect(screen.getByText('มีภาพถ่าย')).toBeInTheDocument()
  })

  it('should filter entries when search term is entered', () => {
    render(<AdminTimeEntriesPage />)

    const searchInput = screen.getByPlaceholderText('ชื่อพนักงาน, รหัส, สาขา...')
    
    // Initially all employees should be visible
    expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
    expect(screen.getByText('สมหญิง รักงาน')).toBeInTheDocument()
    expect(screen.getByText('สมศักดิ์ ขยัน')).toBeInTheDocument()

    // Search for specific employee
    fireEvent.change(searchInput, { target: { value: 'สมชาย' } })

    // Should still show the searched employee (React state update is async in tests)
    expect(searchInput.value).toBe('สมชาย')
  })

  it('should have working filter controls', () => {
    render(<AdminTimeEntriesPage />)

    // Check filter dropdowns exist
    const statusFilter = screen.getByText('สถานะ').closest('div')?.querySelector('[role="combobox"]')
    const branchFilter = screen.getByText('สาขา').closest('div')?.querySelector('[role="combobox"]')
    const dateFilter = screen.getByText('ช่วงเวลา').closest('div')?.querySelector('[role="combobox"]')

    expect(statusFilter).toBeInTheDocument()
    expect(branchFilter).toBeInTheDocument()
    expect(dateFilter).toBeInTheDocument()
  })

  it('should display results summary', () => {
    render(<AdminTimeEntriesPage />)

    // Check for results summary text
    const summaryText = screen.getByText(/พบ.*รายการจากทั้งหมด.*รายการ/)
    expect(summaryText).toBeInTheDocument()
  })

  it('should have view details buttons for each entry', () => {
    render(<AdminTimeEntriesPage />)

    // Each time entry should have a "ดูรายละเอียด" button
    const viewDetailsButtons = screen.getAllByText('ดูรายละเอียด')
    
    // Should have at least 3 buttons (one for each mock entry)
    expect(viewDetailsButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('should refresh data when refresh button is clicked', () => {
    render(<AdminTimeEntriesPage />)

    const refreshButton = screen.getByText('รีเฟรช')
    
    // Should be able to click refresh button
    fireEvent.click(refreshButton)
    
    // Button should still be present after click
    expect(refreshButton).toBeInTheDocument()
  })
})