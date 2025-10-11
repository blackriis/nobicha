import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DailySalesPage from '@/app/dashboard/daily-sales/page'

// Mock dependencies
vi.mock('@/components/auth/AuthProvider', () => ({
 useAuth: vi.fn(),
}))

vi.mock('next/navigation', () => ({
 useRouter: vi.fn(),
}))

vi.mock('@/lib/services/sales-reports.service', () => ({
 SalesReportsService: {
  submitReport: vi.fn(),
  getTodaysReport: vi.fn(),
  getReports: vi.fn(),
  validateSalesReportData: vi.fn(),
  formatCurrency: vi.fn((amount) => `฿${amount.toLocaleString()}`),
  formatReportDate: vi.fn((date) => new Date(date).toLocaleDateString('th-TH')),
 },
}))

vi.mock('@/lib/utils/sales-reports.utils', () => ({
 validateSalesAmount: vi.fn(),
 formatSalesAmountForInput: vi.fn((input) => input),
 parseSalesAmount: vi.fn((input) => parseFloat(input.replace(/,/g, ''))),
 formatThaiCurrency: vi.fn((amount) => `฿${amount.toLocaleString()}`),
 formatThaiDate: vi.fn((date) => new Date(date).toLocaleDateString('th-TH')),
 getCurrentReportDate: vi.fn(() => '2025-01-17'),
}))

vi.mock('sonner', () => ({
 toast: {
  success: vi.fn(),
  error: vi.fn(),
 },
}))

// Mock child components
vi.mock('@/components/dashboard/EmployeeDashboardHeader', () => ({
 EmployeeDashboardHeader: () => <div data-testid="dashboard-header">Dashboard Header</div>,
}))

vi.mock('@/components/employee/SlipImageUpload', () => ({
 SlipImageUpload: ({ onImageSelect, disabled }: any) => (
  <div data-testid="slip-image-upload">
   <input
    type="file"
    data-testid="file-input"
    disabled={disabled}
    onChange={(e) => onImageSelect(e.target.files?.[0] || null)}
   />
  </div>
 ),
}))

vi.mock('@/components/employee/SubmissionResult', () => ({
 SubmissionResult: ({ success, title, onClose }: any) => (
  <div data-testid="submission-result">
   <div data-testid="result-title">{title}</div>
   <div data-testid="result-success">Success: {success ? 'true' : 'false'}</div>
   <button onClick={onClose}>Close</button>
  </div>
 ),
}))

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { SalesReportsService } from '@/lib/services/sales-reports.service'
import { validateSalesAmount } from '@/lib/utils/sales-reports.utils'
import { toast } from 'sonner'

describe('Daily Sales Workflow Integration', () => {
 const mockRouter = {
  push: vi.fn(),
 }

 const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  home_branch: {
   id: 'branch-1',
   name: 'ทดสอบ',
   latitude: 13.7563,
   longitude: 100.5018,
  },
 }

 beforeEach(() => {
  vi.clearAllMocks()

  // Setup auth mock
  vi.mocked(useAuth).mockReturnValue({
   user: mockUser,
   loading: false,
   signIn: vi.fn(),
   signOut: vi.fn(),
  } as any)

  // Setup router mock
  vi.mocked(useRouter).mockReturnValue(mockRouter as any)

  // Setup validation mock
  vi.mocked(validateSalesAmount).mockReturnValue({
   valid: true,
   errors: [],
  })

  // Setup service mocks
  vi.mocked(SalesReportsService.getTodaysReport).mockResolvedValue({
   success: true,
   data: [],
  })

  vi.mocked(SalesReportsService.getReports).mockResolvedValue({
   success: true,
   data: [],
  })
 })

 afterEach(() => {
  vi.resetAllMocks()
 })

 it('should complete full daily sales reporting workflow', async () => {
  const user = userEvent.setup()
  
  // Mock successful submission
  const mockSubmitResult = {
   success: true,
   message: 'บันทึกรายงานยอดขายสำเร็จ',
   data: {
    id: 'report-1',
    total_sales: 2500.75,
    report_date: '2025-01-17',
    slip_image_url: 'https://example.com/slip.jpg',
    branches: { id: 'branch-1', name: 'ทดสอบ' },
    created_at: '2025-01-17T12:00:00Z',
   },
  }

  vi.mocked(SalesReportsService.submitReport).mockResolvedValue(mockSubmitResult)

  render(<DailySalesPage />)

  // Wait for page to load
  await waitFor(() => {
   expect(screen.getByText('รายงานยอดขายรายวัน')).toBeInTheDocument()
  })

  // Verify initial state
  expect(screen.getByText('สาขาทดสอบ')).toBeInTheDocument()
  expect(screen.getByText('พร้อมรายงานยอดขาย')).toBeInTheDocument()

  // Fill in sales amount
  const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
  await user.clear(salesInput)
  await user.type(salesInput, '2500.75')

  // Upload slip image
  const fileInput = screen.getByTestId('file-input')
  const mockFile = new File(['slip content'], 'slip.jpg', { type: 'image/jpeg' })
  await user.upload(fileInput, mockFile)

  // Wait for form to become submittable
  await waitFor(() => {
   const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
   expect(submitButton).not.toBeDisabled()
  })

  // Submit the form
  const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
  await user.click(submitButton)

  // Verify submission was called with correct data
  await waitFor(() => {
   expect(SalesReportsService.submitReport).toHaveBeenCalledWith({
    totalSales: 2500.75,
    slipImage: mockFile,
   })
  })

  // Verify success feedback
  await waitFor(() => {
   expect(toast.success).toHaveBeenCalled()
   expect(screen.getByTestId('submission-result')).toBeInTheDocument()
   expect(screen.getByTestId('result-title')).toHaveTextContent('บันทึกรายงานยอดขายสำเร็จ')
   expect(screen.getByTestId('result-success')).toHaveTextContent('Success: true')
  })
 })

 it('should handle duplicate report submission', async () => {
  const user = userEvent.setup()
  
  // Mock today's report already exists
  vi.mocked(SalesReportsService.getTodaysReport).mockResolvedValue({
   success: true,
   data: [{
    id: 'existing-report',
    branch_id: 'branch-1',
    employee_id: 'test-user-id',
    report_date: '2025-01-17',
    total_sales: 1000,
    slip_image_url: 'https://example.com/existing-slip.jpg',
    created_at: '2025-01-17T10:00:00Z',
    branches: {
     id: 'branch-1',
     name: 'ทดสอบ',
     latitude: 13.7563,
     longitude: 100.5018,
    },
   }],
  })

  render(<DailySalesPage />)

  // Wait for page to load and check status
  await waitFor(() => {
   expect(screen.getByText('รายงานยอดขายสำเร็จแล้ว')).toBeInTheDocument()
   expect(screen.getByText('คุณได้ทำการรายงานยอดขายของวันนี้แล้ว')).toBeInTheDocument()
  })

  // Verify form is disabled
  const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
  const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
  
  expect(salesInput).toBeDisabled()
  expect(submitButton).toBeDisabled()

  // Verify existing report is shown in history
  expect(screen.getByText('รายงานวันนี้')).toBeInTheDocument()
 })

 it('should handle validation errors during submission', async () => {
  const user = userEvent.setup()
  
  // Mock validation failure
  vi.mocked(validateSalesAmount).mockReturnValue({
   valid: false,
   errors: ['ยอดขายต้องเป็นตัวเลขบวกเท่านั้น'],
  })

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(screen.getByText('รายงานยอดขายรายวัน')).toBeInTheDocument()
  })

  // Fill in invalid sales amount
  const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
  await user.type(salesInput, '-100')

  // Try to submit without file
  const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
  await user.click(submitButton)

  // Verify validation errors are shown
  await waitFor(() => {
   expect(screen.getByText('กรุณาแก้ไขข้อมูลต่อไปนี้:')).toBeInTheDocument()
   expect(screen.getByText('ยอดขายต้องเป็นตัวเลขบวกเท่านั้น')).toBeInTheDocument()
   expect(screen.getByText('กรุณาแนบรูปภาพสลิปยืนยันยอดขาย')).toBeInTheDocument()
  })

  expect(toast.error).toHaveBeenCalledWith('กรุณาตรวจสอบข้อมูลที่กรอก')
  expect(SalesReportsService.submitReport).not.toHaveBeenCalled()
 })

 it('should handle API errors during submission', async () => {
  const user = userEvent.setup()
  
  // Mock API error
  const mockSubmitResult = {
   success: false,
   error: 'คุณได้ทำการรายงานยอดขายของวันนี้แล้ว',
  }

  vi.mocked(SalesReportsService.submitReport).mockResolvedValue(mockSubmitResult)

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(screen.getByText('รายงานยอดขายรายวัน')).toBeInTheDocument()
  })

  // Fill valid form
  const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
  await user.type(salesInput, '1500')

  const fileInput = screen.getByTestId('file-input')
  const mockFile = new File(['slip content'], 'slip.jpg', { type: 'image/jpeg' })
  await user.upload(fileInput, mockFile)

  // Submit form
  await waitFor(() => {
   const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
   expect(submitButton).not.toBeDisabled()
  })

  const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
  await user.click(submitButton)

  // Verify error handling
  await waitFor(() => {
   expect(toast.error).toHaveBeenCalledWith('คุณได้ทำการรายงานยอดขายของวันนี้แล้ว')
  })
 })

 it('should redirect unauthenticated users', async () => {
  // Mock no user
  vi.mocked(useAuth).mockReturnValue({
   user: null,
   loading: false,
   signIn: vi.fn(),
   signOut: vi.fn(),
  } as any)

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(mockRouter.push).toHaveBeenCalledWith('/login/employee')
  })
 })

 it('should handle missing branch information', async () => {
  // Mock user without branch
  const userWithoutBranch = {
   ...mockUser,
   home_branch: null,
  }

  vi.mocked(useAuth).mockReturnValue({
   user: userWithoutBranch,
   loading: false,
   signIn: vi.fn(),
   signOut: vi.fn(),
  } as any)

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(screen.getByText('ไม่พบข้อมูลสาขา')).toBeInTheDocument()
   expect(screen.getByText('ไม่พบข้อมูลสาขาที่ท่านสังกัด กรุณาติดต่อผู้ดูแลระบบ')).toBeInTheDocument()
  })
 })

 it('should display reports history', async () => {
  // Mock historical reports
  const mockHistoryReports = [
   {
    id: 'report-1',
    branch_id: 'branch-1',
    employee_id: 'test-user-id',
    report_date: '2025-01-16',
    total_sales: 1500,
    slip_image_url: 'https://example.com/slip1.jpg',
    created_at: '2025-01-16T12:00:00Z',
    branches: {
     id: 'branch-1',
     name: 'ทดสอบ',
     latitude: 13.7563,
     longitude: 100.5018,
    },
   },
  ]

  vi.mocked(SalesReportsService.getReports).mockResolvedValue({
   success: true,
   data: mockHistoryReports,
  })

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(screen.getByText('ประวัติรายงานทั้งหมด')).toBeInTheDocument()
  })

  // History should be loaded
  expect(SalesReportsService.getReports).toHaveBeenCalled()
 })

 it('should show loading state', () => {
  // Mock loading state
  vi.mocked(useAuth).mockReturnValue({
   user: null,
   loading: true,
   signIn: vi.fn(),
   signOut: vi.fn(),
  } as any)

  render(<DailySalesPage />)

  expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument()
 })
})