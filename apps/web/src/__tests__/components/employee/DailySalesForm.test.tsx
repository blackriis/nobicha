import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DailySalesForm } from '@/components/employee/DailySalesForm'
import { SalesReportsService } from '@/lib/services/sales-reports.service'

// Mock dependencies
vi.mock('@/lib/services/sales-reports.service', () => ({
  SalesReportsService: {
    submitReport: vi.fn(),
    validateSalesReportData: vi.fn(),
  },
}))

vi.mock('@/lib/utils/sales-reports.utils', () => ({
  validateSalesAmount: vi.fn(),
  formatSalesAmountForInput: vi.fn((input) => input),
  parseSalesAmount: vi.fn((input) => parseFloat(input.replace(/,/g, ''))),
  formatThaiCurrency: vi.fn((amount) => `฿${amount.toLocaleString()}`),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock child components
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
      <div>{title}</div>
      <div>Success: {success ? 'true' : 'false'}</div>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

import { validateSalesAmount } from '@/lib/utils/sales-reports.utils'
import { toast } from 'sonner'

describe('DailySalesForm', () => {
  const mockOnSubmissionSuccess = vi.fn()
  const defaultProps = {
    branchName: 'ทดสอบ',
    onSubmissionSuccess: mockOnSubmissionSuccess,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default validation mock
    vi.mocked(validateSalesAmount).mockReturnValue({
      valid: true,
      errors: [],
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render form with all required elements', () => {
    render(<DailySalesForm {...defaultProps} />)

    expect(screen.getByText('รายงานยอดขายรายวัน - สาขาทดสอบ')).toBeInTheDocument()
    expect(screen.getByLabelText('ยอดขายรวม (บาท) *')).toBeInTheDocument()
    expect(screen.getByLabelText('รูปภาพสลิปยืนยันยอดขาย *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })).toBeInTheDocument()
  })

  it('should disable submit button when form is incomplete', () => {
    render(<DailySalesForm {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when form is complete', async () => {
    render(<DailySalesForm {...defaultProps} />)

    // Fill sales amount
    const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
    fireEvent.change(salesInput, { target: { value: '1500.50' } })

    // Add file
    const fileInput = screen.getByTestId('file-input')
    const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('should show validation errors when form is invalid', async () => {
    vi.mocked(validateSalesAmount).mockReturnValue({
      valid: false,
      errors: ['ยอดขายต้องเป็นตัวเลขบวกเท่านั้น'],
    })

    render(<DailySalesForm {...defaultProps} />)

    // Fill invalid sales amount
    const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
    fireEvent.change(salesInput, { target: { value: '-100' } })

    // Try to submit
    const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('กรุณาแก้ไขข้อมูลต่อไปนี้:')).toBeInTheDocument()
      expect(screen.getByText('ยอดขายต้องเป็นตัวเลขบวกเท่านั้น')).toBeInTheDocument()
    })
  })

  it('should successfully submit valid form', async () => {
    const mockSubmitResult = {
      success: true,
      message: 'บันทึกรายงานยอดขายสำเร็จ',
      data: {
        id: 'report-1',
        total_sales: 1500.50,
        report_date: '2025-01-17',
        branches: { id: 'branch-1', name: 'สาขาทดสอบ' },
      },
    }

    vi.mocked(SalesReportsService.submitReport).mockResolvedValue(mockSubmitResult)

    render(<DailySalesForm {...defaultProps} />)

    // Fill form
    const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
    fireEvent.change(salesInput, { target: { value: '1500.50' } })

    const fileInput = screen.getByTestId('file-input')
    const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(SalesReportsService.submitReport).toHaveBeenCalledWith({
        totalSales: 1500.50,
        slipImage: mockFile,
      })
      expect(mockOnSubmissionSuccess).toHaveBeenCalledWith(mockSubmitResult.data)
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('should handle submission error', async () => {
    const mockSubmitResult = {
      success: false,
      error: 'คุณได้ทำการรายงานยอดขายของวันนี้แล้ว',
    }

    vi.mocked(SalesReportsService.submitReport).mockResolvedValue(mockSubmitResult)

    render(<DailySalesForm {...defaultProps} />)

    // Fill form
    const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
    fireEvent.change(salesInput, { target: { value: '1500.50' } })

    const fileInput = screen.getByTestId('file-input')
    const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('คุณได้ทำการรายงานยอดขายของวันนี้แล้ว')
    })
  })

  it('should show submission result after successful submit', async () => {
    const mockSubmitResult = {
      success: true,
      message: 'บันทึกรายงานยอดขายสำเร็จ',
      data: {
        id: 'report-1',
        total_sales: 1500.50,
        report_date: '2025-01-17',
        branches: { id: 'branch-1', name: 'สาขาทดสอบ' },
      },
    }

    vi.mocked(SalesReportsService.submitReport).mockResolvedValue(mockSubmitResult)

    render(<DailySalesForm {...defaultProps} />)

    // Fill and submit form
    const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
    fireEvent.change(salesInput, { target: { value: '1500.50' } })

    const fileInput = screen.getByTestId('file-input')
    const mockFile = new File(['test'], 'slip.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('submission-result')).toBeInTheDocument()
      expect(screen.getByText('บันทึกรายงานยอดขายสำเร็จ')).toBeInTheDocument()
      expect(screen.getByText('Success: true')).toBeInTheDocument()
    })
  })

  it('should disable form when disabled prop is true', () => {
    render(<DailySalesForm {...defaultProps} disabled={true} />)

    const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
    const submitButton = screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i })

    expect(salesInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(screen.getByText('คุณได้ทำการรายงานยอดขายของวันนี้แล้ว')).toBeInTheDocument()
  })

  it('should clear validation errors when user types', async () => {
    vi.mocked(validateSalesAmount).mockReturnValueOnce({
      valid: false,
      errors: ['ยอดขายต้องเป็นตัวเลขบวกเท่านั้น'],
    }).mockReturnValueOnce({
      valid: true,
      errors: [],
    })

    render(<DailySalesForm {...defaultProps} />)

    const salesInput = screen.getByLabelText('ยอดขายรวม (บาท) *')
    
    // Enter invalid value first
    fireEvent.change(salesInput, { target: { value: '-100' } })
    fireEvent.click(screen.getByRole('button', { name: /บันทึกรายงานยอดขาย/i }))

    await waitFor(() => {
      expect(screen.getByText('ยอดขายต้องเป็นตัวเลขบวกเท่านั้น')).toBeInTheDocument()
    })

    // Enter valid value
    fireEvent.change(salesInput, { target: { value: '1500' } })

    await waitFor(() => {
      expect(screen.queryByText('ยอดขายต้องเป็นตัวเลขบวกเท่านั้น')).not.toBeInTheDocument()
    })
  })
})