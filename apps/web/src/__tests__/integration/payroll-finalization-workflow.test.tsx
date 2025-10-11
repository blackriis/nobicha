import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PayrollPage from '@/app/admin/payroll/page'
import { PayrollService } from '@/features/payroll/services/payroll.service'

// Mock all external dependencies
vi.mock('@/components/auth/ProtectedRoute', () => ({
 ProtectedRoute: ({ children }: { children: React.ReactNode }) => children
}))

vi.mock('@/components/admin/AdminHeader', () => ({
 AdminHeader: () => <div data-testid="admin-header">Admin Header</div>
}))

vi.mock('@/features/payroll/services/payroll.service', () => ({
 PayrollService: {
  getPayrollCycles: vi.fn(),
  getPayrollSummary: vi.fn(),
  finalizePayrollCycle: vi.fn(),
  exportPayrollReport: vi.fn(),
  downloadCSVFile: vi.fn(),
  canFinalizeCycle: vi.fn(),
  formatCurrency: vi.fn((amount: number) => {
   return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
   }).format(amount)
  })
 }
}))

vi.mock('@/features/payroll/services/payroll-export.service', () => ({
 payrollExportService: {
  getHistoricalCycles: vi.fn()
 }
}))

describe('Payroll Finalization Workflow Integration Tests', () => {
 const mockActiveCycle = {
  id: 'active-cycle-id',
  name: 'เงินเดือนมกราคม 2568',
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  status: 'active' as const,
  created_at: '2025-01-01T00:00:00Z'
 }

 const mockCompletedCycle = {
  id: 'completed-cycle-id',
  name: 'เงินเดือนธันวาคม 2567',
  start_date: '2024-12-01',
  end_date: '2024-12-31',
  status: 'completed' as const,
  created_at: '2024-12-01T00:00:00Z',
  finalized_at: '2024-12-31T23:59:59Z',
  total_employees: 10,
  total_amount: 350000
 }

 const mockPayrollSummary = {
  cycle_info: mockActiveCycle,
  totals: {
   total_employees: 8,
   total_base_pay: 240000,
   total_overtime_pay: 40000,
   total_bonus: 16000,
   total_deduction: 4000,
   total_net_pay: 292000,
   average_net_pay: 36500
  },
  validation: {
   can_finalize: true,
   issues_count: 0,
   employees_with_negative_net_pay: 0,
   employees_with_missing_data: 0,
   validation_issues: []
  },
  branch_breakdown: [
   {
    branch_id: 'branch-1',
    branch_name: 'สาขาหลัก',
    employee_count: 5,
    total_net_pay: 182500,
    total_base_pay: 150000,
    total_bonus: 10000,
    total_deduction: 2500
   }
  ],
  employee_details: []
 }

 const mockFinalizationResult = {
  message: 'ปิดรอบการจ่ายเงินเดือน "เงินเดือนมกราคม 2568" เรียบร้อยแล้ว',
  finalization_summary: {
   cycle_info: {
    ...mockActiveCycle,
    status: 'completed' as const,
    finalized_at: '2025-01-31T23:59:59Z',
    finalized_by: 'admin-user-id'
   },
   totals: mockPayrollSummary.totals,
   finalization_details: {
    finalized_at: '2025-01-31T23:59:59Z',
    finalized_by_user_id: 'admin-user-id',
    validation_passed: true,
    audit_log_created: true
   }
  }
 }

 beforeEach(() => {
  vi.clearAllMocks()
  
  // Mock default service responses
  vi.mocked(PayrollService.getPayrollCycles).mockResolvedValue({
   success: true,
   data: {
    payroll_cycles: [mockActiveCycle, mockCompletedCycle]
   }
  })

  vi.mocked(PayrollService.getPayrollSummary).mockResolvedValue({
   success: true,
   data: { summary: mockPayrollSummary }
  })

  vi.mocked(PayrollService.canFinalizeCycle).mockReturnValue({
   canFinalize: true,
   reasons: []
  })

  vi.mocked(PayrollService.finalizePayrollCycle).mockResolvedValue({
   success: true,
   data: mockFinalizationResult
  })

  // Mock DOM methods
  Object.defineProperty(window, 'alert', {
   value: vi.fn(),
   writable: true
  })

  Object.defineProperty(window, 'confirm', {
   value: vi.fn(() => true),
   writable: true
  })
 })

 afterEach(() => {
  vi.restoreAllMocks()
 })

 it('should complete full payroll finalization workflow', async () => {
  const user = userEvent.setup()
  render(<PayrollPage />)

  // 1. Should show payroll cycles list
  await waitFor(() => {
   expect(screen.getByText('จัดการเงินเดือน')).toBeInTheDocument()
  })

  expect(screen.getByText('เงินเดือนมกราคม 2568')).toBeInTheDocument()
  expect(screen.getByText('เงินเดือนธันวาคม 2567')).toBeInTheDocument()

  // 2. Click finalize button for active cycle
  const finalizeButton = screen.getByText('🔒 ปิดรอบ')
  await user.click(finalizeButton)

  // 3. Should navigate to finalization summary page
  await waitFor(() => {
   expect(screen.getByText('ปิดรอบการจ่ายเงินเดือน')).toBeInTheDocument()
  })

  // 4. Should load and display summary
  expect(PayrollService.getPayrollSummary).toHaveBeenCalledWith('active-cycle-id')
  
  await waitFor(() => {
   expect(screen.getByText('8')).toBeInTheDocument() // Total employees
  })

  expect(screen.getByText('฿292,000.00')).toBeInTheDocument() // Total net pay
  expect(screen.getByText('✅ พร้อมปิดรอบ')).toBeInTheDocument()

  // 5. Click finalize button in summary
  const summaryfinalizeButton = screen.getByText('🔒 ปิดรอบการจ่ายเงินเดือน')
  await user.click(summaryfinalizeButton)

  // 6. Should show confirmation dialog
  await waitFor(() => {
   expect(screen.getByText('🔒 ยืนยันการปิดรอบการจ่ายเงินเดือน')).toBeInTheDocument()
  })

  expect(screen.getByText('กรุณาตรวจสอบข้อมูลก่อนปิดรอบ')).toBeInTheDocument()
  expect(screen.getByText('เงินเดือนมกราคม 2568')).toBeInTheDocument()

  // 7. Check the confirmation checkbox
  const confirmationCheckbox = screen.getByRole('checkbox')
  await user.click(confirmationCheckbox)

  // 8. Click final confirm button
  const confirmButton = screen.getByRole('button', { name: /🔒 ปิดรอบการจ่ายเงินเดือน/ })
  await user.click(confirmButton)

  // 9. Should call finalization API
  expect(PayrollService.finalizePayrollCycle).toHaveBeenCalledWith('active-cycle-id')

  // 10. Should show success message and redirect
  await waitFor(() => {
   expect(window.alert).toHaveBeenCalledWith(
    'ปิดรอบการจ่ายเงินเดือน "เงินเดือนมกราคม 2568" เรียบร้อยแล้ว'
   )
  })
 })

 it('should handle finalization with validation issues', async () => {
  const user = userEvent.setup()
  
  // Mock summary with validation issues
  const summaryWithIssues = {
   ...mockPayrollSummary,
   validation: {
    can_finalize: false,
    issues_count: 1,
    employees_with_negative_net_pay: 1,
    employees_with_missing_data: 0,
    validation_issues: [
     {
      type: 'negative_net_pay',
      employee_name: 'สมชาย ใจดี',
      employee_id: 'EMP001',
      details: { net_pay: -5000 }
     }
    ]
   }
  }

  vi.mocked(PayrollService.getPayrollSummary).mockResolvedValue({
   success: true,
   data: { summary: summaryWithIssues }
  })

  vi.mocked(PayrollService.canFinalizeCycle).mockReturnValue({
   canFinalize: false,
   reasons: ['มีพนักงาน 1 คนที่มีเงินเดือนสุทธิติดลบ']
  })

  render(<PayrollPage />)

  // Navigate to finalization page
  await waitFor(() => {
   expect(screen.getByText('🔒 ปิดรอบ')).toBeInTheDocument()
  })

  await user.click(screen.getByText('🔒 ปิดรอบ'))

  // Should show validation issues
  await waitFor(() => {
   expect(screen.getByText('❌ ยังไม่พร้อม')).toBeInTheDocument()
  })

  expect(screen.getByText('ปัญหาที่ต้องแก้ไขก่อนปิดรอบ:')).toBeInTheDocument()
  expect(screen.getByText('มีพนักงาน 1 คนที่มีเงินเดือนสุทธิติดลบ')).toBeInTheDocument()

  // Finalize button should be disabled
  const disabledFinalizeButton = screen.getByText('🔒 ยังไม่สามารถปิดรอบได้')
  expect(disabledFinalizeButton).toBeDisabled()
 })

 it('should handle export workflow', async () => {
  const user = userEvent.setup()
  
  // Mock export service
  vi.mocked(PayrollService.exportPayrollReport).mockResolvedValue({
   success: true,
   data: new Blob(['mock csv data'], { type: 'text/csv' })
  })

  render(<PayrollPage />)

  // Click export button for a cycle
  await waitFor(() => {
   expect(screen.getByText('📊 ส่งออก')).toBeInTheDocument()
  })

  await user.click(screen.getByText('📊 ส่งออก'))

  // Should navigate to export page
  await waitFor(() => {
   expect(screen.getByText('ส่งออกรายงานเงินเดือน')).toBeInTheDocument()
  })

  expect(screen.getByText('เลือกรูปแบบไฟล์:')).toBeInTheDocument()
  expect(screen.getByText('Excel/CSV File')).toBeInTheDocument()
  expect(screen.getByText('JSON Data')).toBeInTheDocument()

  // CSV should be selected by default
  expect(screen.getByText('เลือกแล้ว')).toBeInTheDocument()

  // Click export button
  const exportButton = screen.getByRole('button', { name: /📥 ส่งออก CSV/ })
  await user.click(exportButton)

  // Should call export API
  expect(PayrollService.exportPayrollReport).toHaveBeenCalledWith(
   mockActiveCycle.id,
   'csv',
   true
  )
 })

 it('should display payroll history', async () => {
  const user = userEvent.setup()
  
  // Mock historical cycles
  const { payrollExportService } = await import('@/features/payroll/services/payroll-export.service')
  vi.mocked(payrollExportService.getHistoricalCycles).mockResolvedValue([
   mockCompletedCycle
  ])

  render(<PayrollPage />)

  // Click history button
  await waitFor(() => {
   expect(screen.getByText('📊 ประวัติรอบ')).toBeInTheDocument()
  })

  await user.click(screen.getByText('📊 ประวัติรอบ'))

  // Should navigate to history page
  await waitFor(() => {
   expect(screen.getByText('ประวัติรอบการจ่ายเงินเดือน')).toBeInTheDocument()
  })

  // Should load historical cycles
  expect(payrollExportService.getHistoricalCycles).toHaveBeenCalled()
 })

 it('should handle navigation between different views', async () => {
  const user = userEvent.setup()
  render(<PayrollPage />)

  // Start from list view
  await waitFor(() => {
   expect(screen.getByText('จัดการเงินเดือน')).toBeInTheDocument()
  })

  // Navigate to finalization
  await user.click(screen.getByText('🔒 ปิดรอบ'))

  await waitFor(() => {
   expect(screen.getByText('ปิดรอบการจ่ายเงินเดือน')).toBeInTheDocument()
  })

  // Navigate back to list
  await user.click(screen.getByText('← กลับไปรายการ'))

  await waitFor(() => {
   expect(screen.getByText('จัดการเงินเดือน')).toBeInTheDocument()
  })

  // Navigate to export
  await user.click(screen.getByText('📊 ส่งออก'))

  await waitFor(() => {
   expect(screen.getByText('ส่งออกรายงานเงินเดือน')).toBeInTheDocument()
  })

  // Navigate back to list
  await user.click(screen.getByText('← กลับไปรายการ'))

  await waitFor(() => {
   expect(screen.getByText('จัดการเงินเดือน')).toBeInTheDocument()
  })
 })

 it('should handle API errors gracefully', async () => {
  const user = userEvent.setup()
  
  // Mock API error
  vi.mocked(PayrollService.getPayrollSummary).mockResolvedValue({
   success: false,
   error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป'
  })

  render(<PayrollPage />)

  // Navigate to finalization
  await user.click(screen.getByText('🔒 ปิดรอบ'))

  // Should show error message
  await waitFor(() => {
   expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument()
  })

  expect(screen.getByText('เกิดข้อผิดพลาดในการดึงข้อมูลสรุป')).toBeInTheDocument()
  expect(screen.getByText('ลองใหม่')).toBeInTheDocument()
 })

 it('should handle finalization API failure', async () => {
  const user = userEvent.setup()
  
  // Mock finalization failure
  vi.mocked(PayrollService.finalizePayrollCycle).mockResolvedValue({
   success: false,
   error: 'เกิดข้อผิดพลาดในการปิดรอบ'
  })

  render(<PayrollPage />)

  // Navigate to finalization and try to finalize
  await user.click(screen.getByText('🔒 ปิดรอบ'))

  await waitFor(() => {
   expect(screen.getByText('🔒 ปิดรอบการจ่ายเงินเดือน')).toBeInTheDocument()
  })

  await user.click(screen.getByText('🔒 ปิดรอบการจ่ายเงินเดือน'))

  await waitFor(() => {
   expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  await user.click(screen.getByRole('checkbox'))
  await user.click(screen.getByRole('button', { name: /🔒 ปิดรอบการจ่ายเงินเดือน/ }))

  // Should show error in dialog
  await waitFor(() => {
   expect(screen.getByText('❌ เกิดข้อผิดพลาดในการปิดรอบ')).toBeInTheDocument()
  })
 })
})