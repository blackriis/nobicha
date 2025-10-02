import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MaterialDetailPage } from '@/components/admin/reports/MaterialDetailPage'
import { adminReportsService } from '@/lib/services/admin-reports.service'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn()
}))

// Mock admin reports service
vi.mock('@/lib/services/admin-reports.service', () => ({
  adminReportsService: {
    getMaterialReports: vi.fn(),
    validateDateRange: vi.fn(),
    formatCurrency: vi.fn(),
    formatDateForDisplay: vi.fn()
  }
}))

// Mock child components
vi.mock('@/components/admin/reports/ReportsDateFilter', () => ({
  ReportsDateFilter: ({ onRangeChange }: any) => {
    return (
      <div data-testid="date-filter">
        <button onClick={() => onRangeChange({ type: 'week' })}>
          Change to Week
        </button>
      </div>
    )
  }
}))

vi.mock('@/components/admin/reports/MaterialDetailSummary', () => ({
  MaterialDetailSummary: ({ summary, isLoading }: any) => {
    return (
      <div data-testid="material-summary">
        {isLoading ? 'Loading summary...' : `Summary: ${summary ? 'Data available' : 'No data'}`}
      </div>
    )
  }
}))

vi.mock('@/components/admin/reports/MaterialBranchBreakdown', () => ({
  MaterialBranchBreakdown: ({ branches, isLoading }: any) => {
    return (
      <div data-testid="branch-breakdown">
        {isLoading ? 'Loading branches...' : `Branches: ${branches.length}`}
      </div>
    )
  }
}))

vi.mock('@/components/admin/reports/MaterialUsageTable', () => ({
  MaterialUsageTable: ({ materials, isLoading }: any) => {
    return (
      <div data-testid="usage-table">
        {isLoading ? 'Loading table...' : `Materials: ${materials.length}`}
      </div>
    )
  }
}))

const mockPush = vi.fn()
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  back: vi.fn()
}

const mockSearchParams = {
  get: vi.fn()
}

describe('MaterialDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(useSearchParams as any).mockReturnValue(mockSearchParams)
    ;(adminReportsService.formatCurrency as any).mockImplementation((value: number) => `฿${value.toLocaleString()}`)
    ;(adminReportsService.validateDateRange as any).mockReturnValue({ valid: true })
    ;(adminReportsService.getMaterialReports as any).mockResolvedValue({
      success: true,
      data: {
        summary: {
          totalCost: 15000,
          totalUsageCount: 50,
          uniqueMaterials: 10,
          uniqueBranches: 3,
          uniqueEmployees: 8,
          averageCostPerUsage: 300,
          topMaterial: 'Material A',
          topMaterialCost: 5000
        },
        branchBreakdown: [
          {
            branchId: 'branch1',
            branchName: 'สาขา 1',
            totalCost: 8000,
            usageCount: 30,
            materials: ['mat1', 'mat2'],
            employees: ['emp1', 'emp2'],
            averageCostPerUsage: 267
          }
        ],
        materialBreakdown: [
          {
            materialId: 'mat1',
            materialName: 'Material A',
            unit: 'กก.',
            supplier: 'Supplier A',
            totalQuantity: 100,
            totalCost: 5000,
            usageCount: 20,
            branches: ['branch1'],
            employees: ['emp1'],
            averageCostPerUsage: 250,
            averageQuantityPerUsage: 5
          }
        ]
      }
    })
  })

  it('renders page header and navigation correctly', async () => {
    mockSearchParams.get.mockReturnValue(null)
    
    render(<MaterialDetailPage />)
    
    expect(screen.getByText('รายละเอียดวัตถุดิบ')).toBeInTheDocument()
    expect(screen.getByText('การใช้งานและต้นทุนวัตถุดิบแยกตามสาขาและช่วงเวลา')).toBeInTheDocument()
    expect(screen.getByText('กลับไปรายงานหลัก')).toBeInTheDocument()
  })

  it('loads initial data from URL parameters', async () => {
    mockSearchParams.get.mockImplementation((param: string) => {
      switch (param) {
        case 'dateRange': return 'week'
        case 'startDate': return '2025-01-15'
        case 'endDate': return '2025-01-22'
        default: return null
      }
    })
    
    render(<MaterialDetailPage />)
    
    await waitFor(() => {
      expect(adminReportsService.getMaterialReports).toHaveBeenCalledWith({
        type: 'week',
        startDate: '2025-01-15',
        endDate: '2025-01-22'
      })
    })
  })

  it('displays loading states correctly', () => {
    ;(adminReportsService.getMaterialReports as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    )
    
    render(<MaterialDetailPage />)
    
    expect(screen.getByTestId('material-summary')).toHaveTextContent('Loading summary...')
    expect(screen.getByTestId('branch-breakdown')).toHaveTextContent('Loading branches...')
    expect(screen.getByTestId('usage-table')).toHaveTextContent('Loading table...')
  })

  it('handles date range changes correctly', async () => {
    mockSearchParams.get.mockReturnValue(null)
    
    render(<MaterialDetailPage />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('material-summary')).toHaveTextContent('Data available')
    })
    
    // Change date range
    fireEvent.click(screen.getByText('Change to Week'))
    
    await waitFor(() => {
      expect(adminReportsService.getMaterialReports).toHaveBeenCalledWith({ type: 'week' })
    })
  })

  it('handles back navigation with date range parameters', async () => {
    mockSearchParams.get.mockReturnValue(null)
    
    render(<MaterialDetailPage />)
    
    fireEvent.click(screen.getByText('กลับไปรายงานหลัก'))
    
    expect(mockPush).toHaveBeenCalledWith('/admin/reports?dateRange=all')
  })

  it('handles refresh functionality', async () => {
    mockSearchParams.get.mockReturnValue(null)
    
    render(<MaterialDetailPage />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(adminReportsService.getMaterialReports).toHaveBeenCalledTimes(1)
    })
    
    // Click refresh button
    fireEvent.click(screen.getByText('รีเฟรช'))
    
    await waitFor(() => {
      expect(adminReportsService.getMaterialReports).toHaveBeenCalledTimes(2)
    })
  })

  it('displays error message when API fails', async () => {
    ;(adminReportsService.getMaterialReports as any).mockResolvedValue({
      success: false,
      error: 'Network error'
    })
    
    render(<MaterialDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('displays error for invalid date range', async () => {
    ;(adminReportsService.validateDateRange as any).mockReturnValue({ 
      valid: false, 
      error: 'Invalid date range' 
    })
    
    render(<MaterialDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid date range')).toBeInTheDocument()
    })
  })

  it('passes correct data to child components', async () => {
    mockSearchParams.get.mockReturnValue(null)
    
    render(<MaterialDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('material-summary')).toHaveTextContent('Data available')
      expect(screen.getByTestId('branch-breakdown')).toHaveTextContent('Branches: 1')
      expect(screen.getByTestId('usage-table')).toHaveTextContent('Materials: 1')
    })
  })

  it('updates URL when date range changes', async () => {
    mockSearchParams.get.mockReturnValue(null)
    
    // Mock window.history.replaceState
    const mockReplaceState = vi.fn()
    Object.defineProperty(window, 'history', {
      value: { replaceState: mockReplaceState },
      writable: true
    })
    
    render(<MaterialDetailPage />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('material-summary')).toHaveTextContent('Data available')
    })
    
    // Change date range
    fireEvent.click(screen.getByText('Change to Week'))
    
    await waitFor(() => {
      expect(mockReplaceState).toHaveBeenCalledWith(
        {},
        '',
        '/admin/reports/materials?dateRange=week'
      )
    })
  })
})