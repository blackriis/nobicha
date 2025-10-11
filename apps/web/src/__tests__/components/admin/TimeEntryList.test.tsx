import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { TimeEntryList } from '@/components/admin/TimeEntryList'

// Mock fetch
global.fetch = vi.fn()

// Mock TimeEntryDetailModal component
vi.mock('@/components/employee/TimeEntryDetailModal', () => ({
 TimeEntryDetailModal: ({ isOpen, onClose, timeEntryId }: { isOpen: boolean; onClose: () => void; timeEntryId: string }) => (
  isOpen ? (
   <div data-testid="time-entry-detail-modal">
    TimeEntryDetailModal for {timeEntryId}
    <button onClick={onClose}>Close</button>
   </div>
  ) : null
 )
}))

const mockTimeEntries = [
 {
  id: 'entry-1',
  check_in_time: '2024-01-01T09:00:00Z',
  check_out_time: '2024-01-01T17:00:00Z',
  status: 'completed',
  location: {
   latitude: 13.7563,
   longitude: 100.5018,
   address: 'Bangkok, Thailand'
  },
  selfie_url: 'https://example.com/selfie1.jpg',
  material_usage: [],
  created_at: '2024-01-01T09:00:00Z',
  updated_at: '2024-01-01T17:00:00Z'
 },
 {
  id: 'entry-2',
  check_in_time: '2024-01-02T08:30:00Z',
  check_out_time: null,
  status: 'active',
  location: {
   latitude: 13.7563,
   longitude: 100.5018,
   address: 'Bangkok, Thailand'
  },
  selfie_url: null,
  material_usage: [],
  created_at: '2024-01-02T08:30:00Z',
  updated_at: '2024-01-02T08:30:00Z'
 }
]

describe('TimeEntryList', () => {
 beforeEach(() => {
  vi.clearAllMocks()
 })

 it('should render loading state initially', () => {
  vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  expect(screen.getByText('กำลังโหลดข้อมูลการมาทำงาน...')).toBeInTheDocument()
 })

 it('should render time entries when loaded successfully', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: mockTimeEntries,
    total: mockTimeEntries.length
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('พบ 2 รายการ')).toBeInTheDocument()
   expect(screen.getByText('เสร็จสิ้น')).toBeInTheDocument()
   expect(screen.getByText('กำลังทำงาน')).toBeInTheDocument()
  })
 })

 it('should render empty state when no time entries', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: [],
    total: 0
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('ไม่มีข้อมูลการมาทำงาน')).toBeInTheDocument()
   expect(screen.getByText('พนักงานรายนี้ยังไม่มีประวัติการมาทำงาน')).toBeInTheDocument()
  })
 })

 it('should render error state when API fails', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: false,
   json: async () => ({ error: 'API Error' })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('API Error')).toBeInTheDocument()
   expect(screen.getByText('ลองใหม่')).toBeInTheDocument()
  })
 })

 it('should open TimeEntryDetailModal when view details button is clicked', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: mockTimeEntries,
    total: mockTimeEntries.length
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('พบ 2 รายการ')).toBeInTheDocument()
  })
  
  const viewButtons = screen.getAllByTitle('ดูรายละเอียด')
  viewButtons[0].click()
  
  await waitFor(() => {
   expect(screen.getByTestId('time-entry-detail-modal')).toBeInTheDocument()
  })
 })

 it('should display correct time format', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: mockTimeEntries,
    total: mockTimeEntries.length
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('09:00')).toBeInTheDocument()
   expect(screen.getByText('17:00')).toBeInTheDocument()
   expect(screen.getByText('08:30')).toBeInTheDocument()
  })
 })

 it('should display correct date format', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: mockTimeEntries,
    total: mockTimeEntries.length
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('1 ม.ค. 2567')).toBeInTheDocument()
   expect(screen.getByText('2 ม.ค. 2567')).toBeInTheDocument()
  })
 })

 it('should display correct total hours calculation', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: mockTimeEntries,
    total: mockTimeEntries.length
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('8.0 ชั่วโมง')).toBeInTheDocument()
   expect(screen.getByText('-')).toBeInTheDocument()
  })
 })

 it('should display location information', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: mockTimeEntries,
    total: mockTimeEntries.length
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('Bangkok, Thailand')).toBeInTheDocument()
  })
 })

 it('should display correct status badges', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: mockTimeEntries,
    total: mockTimeEntries.length
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('เสร็จสิ้น')).toBeInTheDocument()
   expect(screen.getByText('กำลังทำงาน')).toBeInTheDocument()
  })
 })

 it('should handle time entries without location', async () => {
  const entriesWithoutLocation = mockTimeEntries.map(entry => ({ ...entry, location: null }))
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: entriesWithoutLocation,
    total: entriesWithoutLocation.length
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getAllByText('-')).toHaveLength(2) // One for location, one for total hours
  })
 })

 it('should handle incomplete status', async () => {
  const incompleteEntry = { ...mockTimeEntries[0], status: 'incomplete' }
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: [incompleteEntry],
    total: 1
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(screen.getByText('ไม่สมบูรณ์')).toBeInTheDocument()
  })
 })

 it('should call API with correct URL', async () => {
  vi.mocked(fetch).mockResolvedValue({
   ok: true,
   json: async () => ({
    success: true,
    data: [],
    total: 0
   })
  } as Response)
  
  render(<TimeEntryList employeeId="test-employee-id" />)
  
  await waitFor(() => {
   expect(fetch).toHaveBeenCalledWith('/api/admin/employees/test-employee-id/time-entries', {
    method: 'GET',
    headers: {
     'Content-Type': 'application/json',
    },
   })
  })
 })
})
