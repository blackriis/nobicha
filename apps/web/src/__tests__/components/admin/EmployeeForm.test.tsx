import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmployeeForm } from '@/components/admin/EmployeeForm'
import { EmployeeDetail } from '@/lib/services/employee.service'

// Mock react-hook-form
vi.mock('react-hook-form', async () => {
 const actual = await vi.importActual('react-hook-form')
 return {
  ...actual,
  useForm: vi.fn(() => ({
   register: vi.fn((name) => ({ name })),
   handleSubmit: vi.fn((fn) => (e) => {
    e.preventDefault()
    fn({
     full_name: 'Test Employee',
     email: 'test@example.com',
     password: 'TestPass123',
     home_branch_id: 'branch-1',
     hourly_rate: 50,
     daily_rate: 400,
     is_active: true
    })
   }),
   setValue: vi.fn(),
   watch: vi.fn(() => ({})),
   formState: {
    errors: {},
    isValid: true
   }
  }))
 }
})

// Mock Shadcn components
vi.mock('@/components/ui/button', () => ({
 Button: ({ children, onClick, disabled, ...props }: any) => (
  <button onClick={onClick} disabled={disabled} {...props}>
   {children}
  </button>
 )
}))

vi.mock('@/components/ui/input', () => ({
 Input: ({ ...props }: any) => <input {...props} />
}))

vi.mock('@/components/ui/label', () => ({
 Label: ({ children, ...props }: any) => <label {...props}>{children}</label>
}))

vi.mock('@/components/ui/select', () => ({
 Select: ({ children, onValueChange, ...props }: any) => (
  <select onChange={(e) => onValueChange?.(e.target.value)} {...props}>
   {children}
  </select>
 ),
 SelectContent: ({ children }: any) => <div>{children}</div>,
 SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
 SelectTrigger: ({ children }: any) => <div>{children}</div>,
 SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}))

vi.mock('@/components/ui/card', () => ({
 Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
 CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
 CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
 CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
 CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>
}))

vi.mock('@/components/ui/alert-dialog', () => ({
 AlertDialog: ({ children, open }: any) => open ? <div data-testid="confirmation-dialog">{children}</div> : null,
 AlertDialogAction: ({ children, onClick }: any) => (
  <button onClick={onClick} data-testid="confirm-button">{children}</button>
 ),
 AlertDialogCancel: ({ children }: any) => (
  <button data-testid="cancel-button">{children}</button>
 ),
 AlertDialogContent: ({ children }: any) => <div>{children}</div>,
 AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
 AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
 AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
 AlertDialogTitle: ({ children }: any) => <h3>{children}</h3>
}))

vi.mock('@/components/ui/loading-spinner', () => ({
 LoadingSpinner: ({ className }: any) => <div className={className} data-testid="loading-spinner">Loading...</div>
}))

const mockBranches = [
 { id: 'branch-1', name: 'สาขาหลัก', address: '123 ถนนหลัก กรุงเทพฯ' },
 { id: 'branch-2', name: 'สาขาย่อย', address: '456 ถนนรอง นนทบุรี' }
]

const mockEmployeeData: EmployeeDetail = {
 id: 'employee-1',
 email: 'existing@example.com',
 full_name: 'Existing Employee',
 role: 'employee',
 home_branch_id: 'branch-1',
 hourly_rate: 50,
 daily_rate: 400,
 is_active: true,
 created_at: '2025-01-17T00:00:00Z',
 branch_name: 'สาขาหลัก',
 branch_address: '123 ถนนหลัก กรุงเทพฯ'
}

describe('EmployeeForm', () => {
 const mockOnSubmit = vi.fn()
 const mockOnCancel = vi.fn()

 beforeEach(() => {
  vi.clearAllMocks()
  mockOnSubmit.mockResolvedValue({ success: true })
 })

 describe('Create Mode', () => {
  it('should render create form correctly', () => {
   render(
    <EmployeeForm
     mode="create"
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   expect(screen.getByText('เพิ่มพนักงานใหม่')).toBeInTheDocument()
   expect(screen.getByText('กรอกข้อมูลพนักงานใหม่และกำหนดอัตราค่าแรง')).toBeInTheDocument()
   expect(screen.getByLabelText('ชื่อ-สกุล *')).toBeInTheDocument()
   expect(screen.getByLabelText('อีเมล *')).toBeInTheDocument()
   expect(screen.getByLabelText('รหัสผ่าน *')).toBeInTheDocument()
   expect(screen.getByLabelText('สาขาหลัก *')).toBeInTheDocument()
   expect(screen.getByLabelText('อัตราค่าแรงรายชั่วโมง (บาท) *')).toBeInTheDocument()
   expect(screen.getByLabelText('อัตราค่าแรงรายวัน (บาท) *')).toBeInTheDocument()
   expect(screen.getByText('สร้างพนักงาน')).toBeInTheDocument()
   expect(screen.getByText('ยกเลิก')).toBeInTheDocument()
  })

  it('should show password requirements text', () => {
   render(
    <EmployeeForm
     mode="create"
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   expect(screen.getByText('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข')).toBeInTheDocument()
  })

  it('should call onCancel when cancel button is clicked', async () => {
   const user = userEvent.setup()
   
   render(
    <EmployeeForm
     mode="create"
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   await user.click(screen.getByText('ยกเลิก'))
   expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should show confirmation dialog on form submit', async () => {
   const user = userEvent.setup()
   
   render(
    <EmployeeForm
     mode="create"
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   await user.click(screen.getByText('สร้างพนักงาน'))
   
   await waitFor(() => {
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
   })
   
   expect(screen.getByText('ยืนยันการสร้างพนักงาน')).toBeInTheDocument()
  })

  it('should call onSubmit when confirmation is clicked', async () => {
   const user = userEvent.setup()
   
   render(
    <EmployeeForm
     mode="create"
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   // Submit form
   await user.click(screen.getByText('สร้างพนักงาน'))
   
   // Wait for dialog to appear
   await waitFor(() => {
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
   })

   // Confirm submission
   await user.click(screen.getByTestId('confirm-button'))
   
   await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
   })
  })
 })

 describe('Edit Mode', () => {
  it('should render edit form correctly', () => {
   render(
    <EmployeeForm
     mode="edit"
     initialData={mockEmployeeData}
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   expect(screen.getByText('แก้ไขข้อมูลพนักงาน')).toBeInTheDocument()
   expect(screen.getByText('แก้ไขข้อมูลพนักงานและอัตราค่าแรง (ไม่สามารถแก้ไขอีเมลและรหัสผ่านได้)')).toBeInTheDocument()
   expect(screen.getByLabelText('ชื่อ-สกุล *')).toBeInTheDocument()
   expect(screen.getByLabelText('สาขาหลัก *')).toBeInTheDocument()
   expect(screen.getByLabelText('สถานะ')).toBeInTheDocument()
   expect(screen.getByText('บันทึกการแก้ไข')).toBeInTheDocument()
   expect(screen.getByText('ยกเลิก')).toBeInTheDocument()
  })

  it('should not show password field in edit mode', () => {
   render(
    <EmployeeForm
     mode="edit"
     initialData={mockEmployeeData}
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   expect(screen.queryByLabelText('รหัสผ่าน *')).not.toBeInTheDocument()
   expect(screen.queryByText('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข')).not.toBeInTheDocument()
  })

  it('should show disabled email field in edit mode', () => {
   render(
    <EmployeeForm
     mode="edit"
     initialData={mockEmployeeData}
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   expect(screen.getByText('อีเมล')).toBeInTheDocument()
   expect(screen.getByText('ไม่สามารถแก้ไขอีเมลได้')).toBeInTheDocument()
   
   const emailInput = screen.getByDisplayValue('existing@example.com')
   expect(emailInput).toBeDisabled()
  })

  it('should show status field in edit mode', () => {
   render(
    <EmployeeForm
     mode="edit"
     initialData={mockEmployeeData}
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   expect(screen.getByLabelText('สถานะ')).toBeInTheDocument()
  })

  it('should show confirmation dialog with edit text', async () => {
   const user = userEvent.setup()
   
   render(
    <EmployeeForm
     mode="edit"
     initialData={mockEmployeeData}
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   await user.click(screen.getByText('บันทึกการแก้ไข'))
   
   await waitFor(() => {
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
   })
   
   expect(screen.getByText('ยืนยันการแก้ไขพนักงาน')).toBeInTheDocument()
  })
 })

 describe('Branch Selection', () => {
  it('should render branch options correctly', () => {
   render(
    <EmployeeForm
     mode="create"
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   expect(screen.getByText('เลือกสาขา')).toBeInTheDocument()
   expect(screen.getByText('สาขาหลัก - 123 ถนนหลัก กรุงเทพฯ')).toBeInTheDocument()
   expect(screen.getByText('สาขาย่อย - 456 ถนนรอง นนทบุรี')).toBeInTheDocument()
  })
 })

 describe('Loading States', () => {
  it('should disable form when loading', () => {
   render(
    <EmployeeForm
     mode="create"
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
     isLoading={true}
    />
   )

   const submitButton = screen.getByText('สร้างพนักงาน')
   const cancelButton = screen.getByText('ยกเลิก')
   
   expect(submitButton).toBeDisabled()
   expect(cancelButton).toBeDisabled()
  })

  it('should show loading spinner during submission', async () => {
   mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)))
   
   const user = userEvent.setup()
   
   render(
    <EmployeeForm
     mode="create"
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   // Submit form
   await user.click(screen.getByText('สร้างพนักงาน'))
   
   // Wait for dialog and confirm
   await waitFor(() => {
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
   })
   
   await user.click(screen.getByTestId('confirm-button'))
   
   // Should show loading spinner
   await waitFor(() => {
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
   })
  })
 })

 describe('Error Handling', () => {
  it('should handle submission errors gracefully', async () => {
   mockOnSubmit.mockResolvedValue({ success: false, error: 'Test error' })
   
   const user = userEvent.setup()
   
   render(
    <EmployeeForm
     mode="create"
     branches={mockBranches}
     onSubmit={mockOnSubmit}
     onCancel={mockOnCancel}
    />
   )

   // Submit and confirm
   await user.click(screen.getByText('สร้างพนักงาน'))
   
   await waitFor(() => {
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
   })
   
   await user.click(screen.getByTestId('confirm-button'))
   
   await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
   })
  })
 })
})