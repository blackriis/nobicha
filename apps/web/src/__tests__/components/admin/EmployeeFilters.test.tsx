import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmployeeFilters } from '@/components/admin/EmployeeFilters'

// Mock the branch service
const mockBranches = [
 { id: 'branch-1', name: 'Main Branch', address: '123 Main St' },
 { id: 'branch-2', name: 'Secondary Branch', address: '456 Oak Ave' }
]

vi.mock('@/lib/services', () => ({
 branchService: {
  getAllBranches: vi.fn().mockResolvedValue({
   success: true,
   data: mockBranches,
   error: null
  })
 }
}))

describe('EmployeeFilters', () => {
 const defaultProps = {
  filters: {
   sortBy: 'created_at' as const,
   sortOrder: 'desc' as const
  },
  onFilterChange: vi.fn()
 }

 beforeEach(() => {
  vi.clearAllMocks()
 })

 it('should render all filter controls', async () => {
  render(<EmployeeFilters {...defaultProps} />)

  expect(screen.getByText('บทบาท')).toBeInTheDocument()
  expect(screen.getByText('สถานะ')).toBeInTheDocument()
  expect(screen.getByText('สาขา')).toBeInTheDocument()
 })

 it('should call onFilterChange when role filter changes', () => {
  const onFilterChange = vi.fn()
  render(<EmployeeFilters {...defaultProps} onFilterChange={onFilterChange} />)

  const roleSelect = screen.getByDisplayValue('ทุกบทบาท')
  fireEvent.change(roleSelect, { target: { value: 'admin' } })

  expect(onFilterChange).toHaveBeenCalledWith({
   sortBy: 'created_at',
   sortOrder: 'desc',
   role: 'admin'
  })
 })

 it('should call onFilterChange when status filter changes', () => {
  const onFilterChange = vi.fn()
  render(<EmployeeFilters {...defaultProps} onFilterChange={onFilterChange} />)

  const statusSelect = screen.getByDisplayValue('ทุกสถานะ')
  fireEvent.change(statusSelect, { target: { value: 'active' } })

  expect(onFilterChange).toHaveBeenCalledWith({
   sortBy: 'created_at',
   sortOrder: 'desc',
   status: 'active'
  })
 })

 it('should display current filter values', () => {
  const filtersWithValues = {
   role: 'admin' as const,
   status: 'active' as const,
   branchId: 'branch-1',
   sortBy: 'full_name' as const,
   sortOrder: 'asc' as const
  }

  render(<EmployeeFilters {...defaultProps} filters={filtersWithValues} />)

  expect(screen.getByDisplayValue('ผู้ดูแลระบบ')).toBeInTheDocument()
  expect(screen.getByDisplayValue('ใช้งาน')).toBeInTheDocument()
 })

 it('should show active filters count', () => {
  const filtersWithValues = {
   role: 'admin' as const,
   status: 'active' as const,
   branchId: 'branch-1',
   sortBy: 'full_name' as const,
   sortOrder: 'asc' as const
  }

  render(<EmployeeFilters {...defaultProps} filters={filtersWithValues} />)

  expect(screen.getByText('ตัวกรองที่เลือก (3)')).toBeInTheDocument()
 })

 it('should show clear filters button when filters are active', () => {
  const filtersWithValues = {
   role: 'admin' as const,
   status: 'active' as const,
   sortBy: 'full_name' as const,
   sortOrder: 'asc' as const
  }

  render(<EmployeeFilters {...defaultProps} filters={filtersWithValues} />)

  expect(screen.getByText('ล้างตัวกรอง')).toBeInTheDocument()
 })

 it('should clear all filters when clear button is clicked', () => {
  const onFilterChange = vi.fn()
  const filtersWithValues = {
   role: 'admin' as const,
   status: 'active' as const,
   branchId: 'branch-1',
   sortBy: 'full_name' as const,
   sortOrder: 'asc' as const
  }

  render(<EmployeeFilters {...defaultProps} filters={filtersWithValues} onFilterChange={onFilterChange} />)

  const clearButton = screen.getByText('ล้างตัวกรอง')
  fireEvent.click(clearButton)

  expect(onFilterChange).toHaveBeenCalledWith({
   sortBy: 'created_at',
   sortOrder: 'desc'
  })
 })

 it('should display individual filter badges', () => {
  const filtersWithValues = {
   role: 'admin' as const,
   status: 'active' as const,
   branchId: 'branch-1',
   sortBy: 'full_name' as const,
   sortOrder: 'asc' as const
  }

  render(<EmployeeFilters {...defaultProps} filters={filtersWithValues} />)

  expect(screen.getByText('บทบาท: ผู้ดูแลระบบ')).toBeInTheDocument()
  expect(screen.getByText('สถานะ: ใช้งาน')).toBeInTheDocument()
 })

 it('should remove individual filters when badge close button is clicked', () => {
  const onFilterChange = vi.fn()
  const filtersWithValues = {
   role: 'admin' as const,
   status: 'active' as const,
   sortBy: 'full_name' as const,
   sortOrder: 'asc' as const
  }

  render(<EmployeeFilters {...defaultProps} filters={filtersWithValues} onFilterChange={onFilterChange} />)

  // Find and click the X button on the role filter badge
  const roleBadge = screen.getByText('บทบาท: ผู้ดูแลระบบ').closest('div')
  const closeButton = roleBadge?.querySelector('button')
  
  if (closeButton) {
   fireEvent.click(closeButton)
  }

  expect(onFilterChange).toHaveBeenCalledWith({
   status: 'active',
   sortBy: 'full_name',
   sortOrder: 'asc'
  })
 })

 it('should load and display branch options', async () => {
  render(<EmployeeFilters {...defaultProps} />)

  // Wait for branches to load
  await screen.findByText('Main Branch')
  await screen.findByText('Secondary Branch')

  expect(screen.getByText('Main Branch')).toBeInTheDocument()
  expect(screen.getByText('Secondary Branch')).toBeInTheDocument()
 })
})