import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TablePagination } from '@/components/admin/TablePagination'

describe('TablePagination', () => {
 const defaultProps = {
  currentPage: 1,
  totalPages: 5,
  totalItems: 100,
  itemsPerPage: 20,
  onPageChange: vi.fn(),
  onItemsPerPageChange: vi.fn()
 }

 beforeEach(() => {
  vi.clearAllMocks()
 })

 it('should render pagination info correctly', () => {
  render(<TablePagination {...defaultProps} />)

  expect(screen.getByText('แสดง 1-20 จาก 100 รายการ')).toBeInTheDocument()
  expect(screen.getByText('หน้า 1 จาก 5')).toBeInTheDocument()
 })

 it('should call onPageChange when page navigation is clicked', () => {
  const onPageChange = vi.fn()
  render(<TablePagination {...defaultProps} onPageChange={onPageChange} />)

  const nextButton = screen.getByText('ถัดไป')
  fireEvent.click(nextButton)

  expect(onPageChange).toHaveBeenCalledWith(2)
 })

 it('should disable previous button on first page', () => {
  render(<TablePagination {...defaultProps} currentPage={1} />)

  const prevButton = screen.getByText('ก่อนหน้า')
  expect(prevButton.closest('button')).toBeDisabled()
 })

 it('should disable next button on last page', () => {
  render(<TablePagination {...defaultProps} currentPage={5} />)

  const nextButton = screen.getByText('ถัดไป')
  expect(nextButton.closest('button')).toBeDisabled()
 })

 it('should call onItemsPerPageChange when page size changes', () => {
  const onItemsPerPageChange = vi.fn()
  render(<TablePagination {...defaultProps} onItemsPerPageChange={onItemsPerPageChange} />)

  const sizeSelect = screen.getByDisplayValue('20')
  fireEvent.change(sizeSelect, { target: { value: '50' } })

  expect(onItemsPerPageChange).toHaveBeenCalledWith(50)
 })

 it('should display correct range for middle pages', () => {
  render(<TablePagination {...defaultProps} currentPage={3} />)

  expect(screen.getByText('แสดง 41-60 จาก 100 รายการ')).toBeInTheDocument()
 })

 it('should display correct range for last page with fewer items', () => {
  render(<TablePagination {...defaultProps} currentPage={5} totalItems={95} />)

  expect(screen.getByText('แสดง 81-95 จาก 95 รายการ')).toBeInTheDocument()
 })

 it('should render page number buttons', () => {
  render(<TablePagination {...defaultProps} />)

  expect(screen.getByText('1')).toBeInTheDocument()
  expect(screen.getByText('2')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
 })

 it('should highlight current page', () => {
  render(<TablePagination {...defaultProps} currentPage={2} />)

  const currentPageButton = screen.getByText('2')
  expect(currentPageButton.closest('button')).toHaveClass('bg-primary')
 })

 it('should call onPageChange when page number is clicked', () => {
  const onPageChange = vi.fn()
  render(<TablePagination {...defaultProps} onPageChange={onPageChange} />)

  const page3Button = screen.getByText('3')
  fireEvent.click(page3Button)

  expect(onPageChange).toHaveBeenCalledWith(3)
 })

 it('should show ellipsis for large page counts', () => {
  render(<TablePagination {...defaultProps} totalPages={20} />)

  expect(screen.getByText('...')).toBeInTheDocument()
 })

 it('should handle single page correctly', () => {
  render(<TablePagination {...defaultProps} totalPages={1} totalItems={10} />)

  expect(screen.getByText('แสดง 1-10 จาก 10 รายการ')).toBeInTheDocument()
  expect(screen.getByText('หน้า 1 จาก 1')).toBeInTheDocument()
 })

 it('should render items per page options', () => {
  render(<TablePagination {...defaultProps} />)

  const sizeSelect = screen.getByDisplayValue('20')
  expect(sizeSelect).toBeInTheDocument()
  
  // Check if options are available
  expect(screen.getByText('10')).toBeInTheDocument()
  expect(screen.getByText('20')).toBeInTheDocument()
  expect(screen.getByText('50')).toBeInTheDocument()
  expect(screen.getByText('100')).toBeInTheDocument()
 })
})