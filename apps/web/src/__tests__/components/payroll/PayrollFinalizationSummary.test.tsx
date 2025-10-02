import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PayrollFinalizationSummary from '@/features/payroll/components/PayrollFinalizationSummary'
import { PayrollService } from '@/features/payroll/services/payroll.service'

// Mock PayrollService
vi.mock('@/features/payroll/services/payroll.service', () => ({
  PayrollService: {
    getPayrollSummary: vi.fn(),
    canFinalizeCycle: vi.fn()
  }
}))

describe('PayrollFinalizationSummary Component', () => {
  const mockSummary = {
    cycle_info: {
      id: 'test-cycle-id',
      name: 'เงินเดือนมกราคม 2568',
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      status: 'active' as const,
      created_at: '2025-01-01T00:00:00Z',
      finalized_at: undefined
    },
    totals: {
      total_employees: 10,
      total_base_pay: 300000,
      total_overtime_pay: 50000,
      total_bonus: 20000,
      total_deduction: 5000,
      total_net_pay: 365000,
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
        employee_count: 6,
        total_net_pay: 219000,
        total_base_pay: 180000,
        total_bonus: 12000,
        total_deduction: 3000
      },
      {
        branch_id: 'branch-2',
        branch_name: 'สาขาสาทร',
        employee_count: 4,
        total_net_pay: 146000,
        total_base_pay: 120000,
        total_bonus: 8000,
        total_deduction: 2000
      }
    ],
    employee_details: []
  }

  const defaultProps = {
    cycleId: 'test-cycle-id',
    onFinalize: vi.fn(),
    onExport: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(PayrollService.getPayrollSummary).mockResolvedValue({
      success: true,
      data: { summary: mockSummary }
    })
    vi.mocked(PayrollService.canFinalizeCycle).mockReturnValue({
      canFinalize: true,
      reasons: []
    })
  })

  it('should render loading state initially', () => {
    render(<PayrollFinalizationSummary {...defaultProps} />)
    
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('should display summary information correctly', async () => {
    render(<PayrollFinalizationSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('เงินเดือนมกราคม 2568')).toBeInTheDocument()
    })

    expect(screen.getByText('10')).toBeInTheDocument() // Total employees
    expect(screen.getByText('฿365,000.00')).toBeInTheDocument() // Total net pay
    expect(screen.getByText('฿36,500.00')).toBeInTheDocument() // Average net pay
    expect(screen.getByText('✅ พร้อมปิดรอบ')).toBeInTheDocument()
  })

  it('should display validation issues when present', async () => {
    const summaryWithIssues = {
      ...mockSummary,
      validation: {
        can_finalize: false,
        issues_count: 2,
        employees_with_negative_net_pay: 1,
        employees_with_missing_data: 1,
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
      reasons: ['มีพนักงานที่มีเงินเดือนสุทธิติดลบ']
    })

    render(<PayrollFinalizationSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('❌ ยังไม่พร้อม')).toBeInTheDocument()
    })

    expect(screen.getByText('ปัญหาที่ต้องแก้ไขก่อนปิดรอบ:')).toBeInTheDocument()
    expect(screen.getByText('มีพนักงานที่มีเงินเดือนสุทธิติดลบ')).toBeInTheDocument()
  })

  it('should display branch breakdown correctly', async () => {
    render(<PayrollFinalizationSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('สาขาหลัก')).toBeInTheDocument()
    })

    expect(screen.getByText('สาขาสาทร')).toBeInTheDocument()
    expect(screen.getByText('6 คน')).toBeInTheDocument() // Branch 1 employee count
    expect(screen.getByText('4 คน')).toBeInTheDocument() // Branch 2 employee count
  })

  it('should call onFinalize when finalize button is clicked', async () => {
    const onFinalize = vi.fn()
    render(<PayrollFinalizationSummary {...defaultProps} onFinalize={onFinalize} />)

    await waitFor(() => {
      expect(screen.getByText('🔒 ปิดรอบการจ่ายเงินเดือน')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('🔒 ปิดรอบการจ่ายเงินเดือน'))
    expect(onFinalize).toHaveBeenCalledTimes(1)
  })

  it('should call onExport when export button is clicked', async () => {
    const onExport = vi.fn()
    render(<PayrollFinalizationSummary {...defaultProps} onExport={onExport} />)

    await waitFor(() => {
      expect(screen.getByText('📊 ส่งออกรายงาน')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('📊 ส่งออกรายงาน'))
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('should disable finalize button when cycle cannot be finalized', async () => {
    const summaryWithIssues = {
      ...mockSummary,
      validation: {
        ...mockSummary.validation,
        can_finalize: false
      }
    }

    vi.mocked(PayrollService.getPayrollSummary).mockResolvedValue({
      success: true,
      data: { summary: summaryWithIssues }
    })

    vi.mocked(PayrollService.canFinalizeCycle).mockReturnValue({
      canFinalize: false,
      reasons: ['มีปัญหาในข้อมูล']
    })

    render(<PayrollFinalizationSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('🔒 ยังไม่สามารถปิดรอบได้')).toBeInTheDocument()
    })

    const finalizeButton = screen.getByText('🔒 ยังไม่สามารถปิดรอบได้')
    expect(finalizeButton).toBeDisabled()
  })

  it('should show and hide issue details', async () => {
    const summaryWithIssues = {
      ...mockSummary,
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

    render(<PayrollFinalizationSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('แสดงรายละเอียดปัญหา')).toBeInTheDocument()
    })

    // Click to show details
    fireEvent.click(screen.getByText('แสดงรายละเอียดปัญหา'))
    
    await waitFor(() => {
      expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
    })
    
    expect(screen.getByText('รหัสพนักงาน: EMP001')).toBeInTheDocument()
    expect(screen.getByText('เงินเดือนติดลบ')).toBeInTheDocument()

    // Click to hide details
    fireEvent.click(screen.getByText('ซ่อนรายละเอียด'))
    
    await waitFor(() => {
      expect(screen.queryByText('รหัสพนักงาน: EMP001')).not.toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(PayrollService.getPayrollSummary).mockResolvedValue({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    })

    render(<PayrollFinalizationSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument()
    })

    expect(screen.getByText('เกิดข้อผิดพลาดในการดึงข้อมูล')).toBeInTheDocument()
    expect(screen.getByText('ลองใหม่')).toBeInTheDocument()
  })

  it('should retry loading when retry button is clicked', async () => {
    vi.mocked(PayrollService.getPayrollSummary)
      .mockResolvedValueOnce({
        success: false,
        error: 'เกิดข้อผิดพลาด'
      })
      .mockResolvedValueOnce({
        success: true,
        data: { summary: mockSummary }
      })

    render(<PayrollFinalizationSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('ลองใหม่')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('ลองใหม่'))

    await waitFor(() => {
      expect(screen.getByText('เงินเดือนมกราคม 2568')).toBeInTheDocument()
    })
  })

  it('should display completed cycle status', async () => {
    const completedSummary = {
      ...mockSummary,
      cycle_info: {
        ...mockSummary.cycle_info,
        status: 'completed' as const,
        finalized_at: '2025-01-31T23:59:59Z'
      }
    }

    vi.mocked(PayrollService.getPayrollSummary).mockResolvedValue({
      success: true,
      data: { summary: completedSummary }
    })

    render(<PayrollFinalizationSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('ปิดรอบแล้ว')).toBeInTheDocument()
    })

    expect(screen.getByText(/ปิดรอบเมื่อ:/)).toBeInTheDocument()
  })
})