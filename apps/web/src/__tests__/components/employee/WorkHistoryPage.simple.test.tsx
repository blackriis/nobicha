import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

// Mock all UI components to avoid complex dependencies
vi.mock('@/components/ui/button', () => ({
 Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}))

vi.mock('@/components/ui/card', () => ({
 Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
 CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
 CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
 CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>
}))

vi.mock('lucide-react', () => ({
 RefreshCw: () => <div>RefreshIcon</div>,
 Clock: () => <div>ClockIcon</div>
}))

// Mock components
vi.mock('@/components/employee/DateRangeFilter', () => ({
 DateRangeFilterComponent: ({ selectedRange, onRangeChange }: any) => (
  <div data-testid="date-range-filter">
   <button onClick={() => onRangeChange('today')}>วันนี้</button>
   <button onClick={() => onRangeChange('week')}>7 วันที่ผ่านมา</button>
   <button onClick={() => onRangeChange('month')}>30 วันที่ผ่านมา</button>
  </div>
 )
}))

vi.mock('@/components/employee/TimeEntryCard', () => ({
 TimeEntryCard: ({ timeEntry }: any) => (
  <div data-testid="time-entry-card">
   {timeEntry.branch.name}
  </div>
 )
}))

vi.mock('@/components/employee/EmptyStateMessage', () => ({
 EmptyStateMessage: ({ dateRange }: any) => (
  <div data-testid="empty-state">ไม่มีประวัติการทำงาน</div>
 )
}))

vi.mock('@/components/employee/WorkingHoursDisplay', () => ({
 WorkingHoursDisplay: ({ timeEntries }: any) => (
  <div data-testid="working-hours">สรุปเวลาทำงาน</div>
 )
}))

// Mock the service
vi.mock('@/lib/services/time-entry.service', () => ({
 timeEntryService: {
  getTimeEntryHistory: vi.fn()
 }
}))

// Import after mocks
import { WorkHistoryPage } from '@/components/employee/WorkHistoryPage'
import { timeEntryService } from '@/lib/services/time-entry.service'

describe('WorkHistoryPage - Basic Functionality', () => {
 it('should render without crashing', () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockResolvedValue({
   success: true,
   data: [],
   dateRange: 'today',
   totalCount: 0
  })

  const { container } = render(<WorkHistoryPage />)
  expect(container).toBeInTheDocument()
 })

 it('should contain main page elements', () => {
  vi.mocked(timeEntryService.getTimeEntryHistory).mockResolvedValue({
   success: true,
   data: [],
   dateRange: 'today',
   totalCount: 0
  })

  const { getByText } = render(<WorkHistoryPage />)
  
  expect(getByText('ประวัติการทำงาน')).toBeInTheDocument()
  expect(getByText('รายงานการ check-in/check-out ของคุณ')).toBeInTheDocument()
  expect(getByText('รีเฟรช')).toBeInTheDocument()
 })
})