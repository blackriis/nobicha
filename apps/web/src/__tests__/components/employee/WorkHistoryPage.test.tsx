import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkHistoryPage } from '@/components/employee/WorkHistoryPage'
import { timeEntryService } from '@/lib/services/time-entry.service'

// Mock the service
vi.mock('@/lib/services/time-entry.service', () => ({
 timeEntryService: {
  getTimeEntryHistory: vi.fn(),
  getDateRangeLabel: vi.fn(),
  formatDateForDisplay: vi.fn(),
  formatTimeForDisplay: vi.fn(),
  getWorkStatus: vi.fn(),
  formatWorkingHours: vi.fn()
 }
}))

const mockTimeEntries = [
 {
  id: 'entry-1',
  user_id: 'user-123',
  branch_id: 'branch-1',
  check_in_time: '2024-01-17T08:00:00Z',
  check_out_time: '2024-01-17T17:00:00Z',
  selfie_url: 'https://example.com/selfie.jpg',
  break_duration: 0,
  total_hours: 8,
  notes: 'Test note',
  created_at: '2024-01-17T08:00:00Z',
  branch: {
   id: 'branch-1',
   name: 'สาขาทดสอบ',
   latitude: 13.7563,
   longitude: 100.5018
  }
 }
]

describe('WorkHistoryPage', () => {
 beforeEach(() => {
  vi.clearAllMocks()
  
  // Setup default mock returns
  vi.mocked(timeEntryService.getDateRangeLabel).mockReturnValue('วันนี้')
  vi.mocked(timeEntryService.formatDateForDisplay).mockReturnValue('17 มกราคม 2567')
  vi.mocked(timeEntryService.formatTimeForDisplay).mockReturnValue('08:00')
  vi.mocked(timeEntryService.getWorkStatus).mockReturnValue('เสร็จสิ้น')
  vi.mocked(timeEntryService.formatWorkingHours).mockReturnValue('8 ชั่วโมง')
 })

 afterEach(() => {
  vi.resetAllMocks()
 })

 it('should render page header correctly', async () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockResolvedValue({
   success: true,
   data: [],
   dateRange: 'today',
   totalCount: 0
  })

  render(<WorkHistoryPage />)

  expect(screen.getByText('ประวัติการทำงาน')).toBeInTheDocument()
  expect(screen.getByText('รายงานการ check-in/check-out ของคุณ')).toBeInTheDocument()
  expect(screen.getByText('รีเฟรช')).toBeInTheDocument()
 })

 it('should render date range filter buttons', async () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockResolvedValue({
   success: true,
   data: [],
   dateRange: 'today',
   totalCount: 0
  })

  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('วันนี้')).toBeInTheDocument()
   expect(screen.getByText('7 วันที่ผ่านมา')).toBeInTheDocument()
   expect(screen.getByText('30 วันที่ผ่านมา')).toBeInTheDocument()
  })
 })

 it('should show loading state initially', () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockImplementation(
   () => new Promise(() => {}) // Never resolves to keep loading state
  )

  render(<WorkHistoryPage />)

  expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
 })

 it('should display time entries when data is loaded', async () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockResolvedValue({
   success: true,
   data: mockTimeEntries,
   dateRange: 'today',
   totalCount: 1
  })

  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('สรุปเวลาทำงาน')).toBeInTheDocument()
   expect(screen.getByText('รายการทั้งหมด (1 รายการ)')).toBeInTheDocument()
  })
 })

 it('should show empty state when no data', async () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockResolvedValue({
   success: true,
   data: [],
   dateRange: 'today',
   totalCount: 0
  })

  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('ไม่มีประวัติการทำงาน')).toBeInTheDocument()
  })
 })

 it('should show error state when API fails', async () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockResolvedValue({
   success: false,
   data: [],
   dateRange: 'today',
   totalCount: 0,
   error: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
  })

  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument()
   expect(screen.getByText('เกิดข้อผิดพลาดในการดึงข้อมูล')).toBeInTheDocument()
   expect(screen.getByText('ลองอีกครั้ง')).toBeInTheDocument()
  })
 })

 it('should handle date range change', async () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockResolvedValue({
   success: true,
   data: [],
   dateRange: 'week',
   totalCount: 0
  })

  render(<WorkHistoryPage />)

  await waitFor(() => {
   fireEvent.click(screen.getByText('7 วันที่ผ่านมา'))
  })

  expect(timeEntryService.getTimeEntryHistory).toHaveBeenCalledWith('week')
 })

 it('should handle refresh button click', async () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockResolvedValue({
   success: true,
   data: [],
   dateRange: 'today',
   totalCount: 0
  })

  render(<WorkHistoryPage />)

  await waitFor(() => {
   fireEvent.click(screen.getByText('รีเฟรช'))
  })

  expect(timeEntryService.getTimeEntryHistory).toHaveBeenCalledTimes(2) // Initial + refresh
 })

 it('should handle retry button in error state', async () => {
  vi.mocked(timeEntryService.getTimeEntryHistory)
   .mockResolvedValueOnce({
    success: false,
    data: [],
    dateRange: 'today',
    totalCount: 0,
    error: 'Network error'
   })
   .mockResolvedValueOnce({
    success: true,
    data: [],
    dateRange: 'today',
    totalCount: 0
   })

  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument()
  })

  fireEvent.click(screen.getByText('ลองอีกครั้ง'))

  await waitFor(() => {
   expect(timeEntryService.getTimeEntryHistory).toHaveBeenCalledTimes(2)
  })
 })

 it('should disable buttons during loading', () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockImplementation(
   () => new Promise(() => {}) // Never resolves to keep loading state
  )

  render(<WorkHistoryPage />)

  const refreshButton = screen.getByText('รีเฟรช')
  const dateButtons = screen.getAllByRole('button').filter(btn => 
   btn.textContent?.includes('วัน')
  )

  expect(refreshButton).toBeDisabled()
  dateButtons.forEach(button => {
   expect(button).toBeDisabled()
  })
 })
})