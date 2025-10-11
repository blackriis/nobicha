import { render, screen } from '@testing-library/react'
import { MaterialDetailSummary } from '@/components/admin/reports/MaterialDetailSummary'
import { adminReportsService } from '@/lib/services/admin-reports.service'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock admin reports service
vi.mock('@/lib/services/admin-reports.service', () => ({
 adminReportsService: {
  formatCurrency: vi.fn()
 }
}))

describe('MaterialDetailSummary', () => {
 beforeEach(() => {
  vi.clearAllMocks()
  ;(adminReportsService.formatCurrency as any).mockImplementation((value: number) => `฿${value.toLocaleString()}`)
 })

 const mockSummary = {
  totalCost: 15000,
  totalUsageCount: 50,
  uniqueMaterials: 10,
  uniqueBranches: 3,
  uniqueEmployees: 8,
  averageCostPerUsage: 300,
  topMaterial: 'Material A',
  topMaterialCost: 5000
 }

 it('renders loading state correctly', () => {
  render(<MaterialDetailSummary summary={null} isLoading={true} />)
  
  // Should show loading skeletons
  const loadingCards = screen.getAllByText('', { selector: '.animate-pulse' })
  expect(loadingCards.length).toBeGreaterThan(0)
 })

 it('renders empty state when no summary data', () => {
  render(<MaterialDetailSummary summary={null} isLoading={false} />)
  
  expect(screen.getByText('ไม่มีข้อมูลวัตถุดิบในช่วงเวลาที่เลือก')).toBeInTheDocument()
 })

 it('renders summary cards with correct data', () => {
  render(<MaterialDetailSummary summary={mockSummary} isLoading={false} />)
  
  // Check for key metrics
  expect(screen.getByText('ต้นทุนรวม')).toBeInTheDocument()
  expect(screen.getByText('การใช้งานทั้งหมด')).toBeInTheDocument()
  expect(screen.getByText('วัตถุดิบที่ใช้')).toBeInTheDocument()
  expect(screen.getByText('สาขาที่เกี่ยวข้อง')).toBeInTheDocument()
  expect(screen.getByText('พนักงานที่เกี่ยวข้อง')).toBeInTheDocument()
  expect(screen.getByText('ต้นทุนเฉลี่ยต่อครั้ง')).toBeInTheDocument()
  
  // Check formatted values
  expect(adminReportsService.formatCurrency).toHaveBeenCalledWith(15000)
  expect(adminReportsService.formatCurrency).toHaveBeenCalledWith(300)
  expect(adminReportsService.formatCurrency).toHaveBeenCalledWith(5000)
 })

 it('displays correct numeric values', () => {
  render(<MaterialDetailSummary summary={mockSummary} isLoading={false} />)
  
  expect(screen.getByText('50')).toBeInTheDocument() // totalUsageCount
  expect(screen.getByText('10')).toBeInTheDocument() // uniqueMaterials
  expect(screen.getByText('3')).toBeInTheDocument() // uniqueBranches
  expect(screen.getByText('8')).toBeInTheDocument() // uniqueEmployees
 })

 it('displays top material highlight when available', () => {
  render(<MaterialDetailSummary summary={mockSummary} isLoading={false} />)
  
  expect(screen.getByText('วัตถุดิบที่ใช้มากที่สุด')).toBeInTheDocument()
  expect(screen.getByText('Material A')).toBeInTheDocument()
  expect(screen.getByText('สูงสุด')).toBeInTheDocument()
 })

 it('does not display top material when not available', () => {
  const summaryWithoutTopMaterial = {
   ...mockSummary,
   topMaterial: null,
   topMaterialCost: 0
  }
  
  render(<MaterialDetailSummary summary={summaryWithoutTopMaterial} isLoading={false} />)
  
  expect(screen.queryByText('วัตถุดิบที่ใช้มากที่สุด')).not.toBeInTheDocument()
 })

 it('renders with correct CSS classes and styling', () => {
  render(<MaterialDetailSummary summary={mockSummary} isLoading={false} />)
  
  // Check for grid layout
  const gridContainer = screen.getByText('ต้นทุนรวม').closest('.grid')
  expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
  
  // Check for card styling
  const cards = screen.getAllByText('', { selector: '.' })
  expect(cards.length).toBeGreaterThan(0)
 })

 it('handles large numbers correctly', () => {
  const largeSummary = {
   ...mockSummary,
   totalCost: 1500000,
   totalUsageCount: 5000,
   uniqueMaterials: 100
  }
  
  render(<MaterialDetailSummary summary={largeSummary} isLoading={false} />)
  
  expect(screen.getByText('5,000')).toBeInTheDocument() // formatted totalUsageCount
  expect(screen.getByText('100')).toBeInTheDocument()  // uniqueMaterials
  expect(adminReportsService.formatCurrency).toHaveBeenCalledWith(1500000)
 })

 it('renders all icon components correctly', () => {
  render(<MaterialDetailSummary summary={mockSummary} isLoading={false} />)
  
  // Check that icons are rendered (they should be present in the DOM)
  const iconContainers = screen.getAllByText('', { selector: '.p-2.rounded-lg' })
  expect(iconContainers.length).toBe(6) // Should have 6 summary cards
 })

 it('displays correct suffixes for metrics', () => {
  render(<MaterialDetailSummary summary={mockSummary} isLoading={false} />)
  
  expect(screen.getByText('ครั้ง')).toBeInTheDocument()  // for usage count
  expect(screen.getByText('รายการ')).toBeInTheDocument() // for materials
  expect(screen.getByText('สาขา')).toBeInTheDocument()  // for branches
  expect(screen.getByText('คน')).toBeInTheDocument()   // for employees
 })
})