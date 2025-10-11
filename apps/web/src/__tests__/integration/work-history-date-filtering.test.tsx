import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkHistoryPage } from '@/components/employee/WorkHistoryPage'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock console.error to avoid noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Work History - Date Range Integration Tests', () => {
 beforeEach(() => {
  vi.clearAllMocks()
 })

 afterEach(() => {
  vi.resetAllMocks()
 })

 const createMockResponse = (data: any[], dateRange: string) => ({
  ok: true,
  json: async () => ({
   success: true,
   data,
   dateRange,
   totalCount: data.length
  })
 })

 const todayEntries = [
  {
   id: 'today-1',
   user_id: 'user-123',
   branch_id: 'branch-1',
   check_in_time: '2024-01-17T08:00:00Z',
   check_out_time: '2024-01-17T17:00:00Z',
   total_hours: 8,
   branch: {
    id: 'branch-1',
    name: 'สาขาวันนี้',
    latitude: 13.7563,
    longitude: 100.5018
   }
  }
 ]

 const weekEntries = [
  ...todayEntries,
  {
   id: 'week-1',
   user_id: 'user-123',
   branch_id: 'branch-2',
   check_in_time: '2024-01-15T08:00:00Z',
   check_out_time: '2024-01-15T16:30:00Z',
   total_hours: 7.5,
   branch: {
    id: 'branch-2',
    name: 'สาขาสัปดาห์',
    latitude: 13.7563,
    longitude: 100.5018
   }
  }
 ]

 const monthEntries = [
  ...weekEntries,
  {
   id: 'month-1',
   user_id: 'user-123',
   branch_id: 'branch-3',
   check_in_time: '2023-12-20T09:00:00Z',
   check_out_time: '2023-12-20T18:00:00Z',
   total_hours: 8,
   branch: {
    id: 'branch-3',
    name: 'สาขาเดือน',
    latitude: 13.7563,
    longitude: 100.5018
   }
  }
 ]

 it('should load today\'s entries by default', async () => {
  mockFetch.mockResolvedValueOnce(createMockResponse(todayEntries, 'today'))

  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (1 รายการ)')).toBeInTheDocument()
   expect(screen.getByText('สาขาวันนี้')).toBeInTheDocument()
  })

  expect(mockFetch).toHaveBeenCalledWith(
   '/api/employee/time-entries/history?dateRange=today',
   expect.objectContaining({
    method: 'GET'
   })
  )
 })

 it('should filter by week range when clicked', async () => {
  // Initial load - today
  mockFetch.mockResolvedValueOnce(createMockResponse(todayEntries, 'today'))
  
  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (1 รายการ)')).toBeInTheDocument()
  })

  // Click week filter
  mockFetch.mockResolvedValueOnce(createMockResponse(weekEntries, 'week'))
  
  fireEvent.click(screen.getByText('7 วันที่ผ่านมา'))

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (2 รายการ)')).toBeInTheDocument()
   expect(screen.getByText('สาขาสัปดาห์')).toBeInTheDocument()
  })

  expect(mockFetch).toHaveBeenLastCalledWith(
   '/api/employee/time-entries/history?dateRange=week',
   expect.objectContaining({
    method: 'GET'
   })
  )
 })

 it('should filter by month range when clicked', async () => {
  // Initial load - today
  mockFetch.mockResolvedValueOnce(createMockResponse(todayEntries, 'today'))
  
  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (1 รายการ)')).toBeInTheDocument()
  })

  // Click month filter
  mockFetch.mockResolvedValueOnce(createMockResponse(monthEntries, 'month'))
  
  fireEvent.click(screen.getByText('30 วันที่ผ่านมา'))

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (3 รายการ)')).toBeInTheDocument()
   expect(screen.getByText('สาขาเดือน')).toBeInTheDocument()
  })

  expect(mockFetch).toHaveBeenLastCalledWith(
   '/api/employee/time-entries/history?dateRange=month',
   expect.objectContaining({
    method: 'GET'
   })
  )
 })

 it('should handle switching between different date ranges', async () => {
  // Initial load - today
  mockFetch.mockResolvedValueOnce(createMockResponse(todayEntries, 'today'))
  
  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (1 รายการ)')).toBeInTheDocument()
  })

  // Switch to week
  mockFetch.mockResolvedValueOnce(createMockResponse(weekEntries, 'week'))
  fireEvent.click(screen.getByText('7 วันที่ผ่านมา'))

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (2 รายการ)')).toBeInTheDocument()
  })

  // Switch back to today
  mockFetch.mockResolvedValueOnce(createMockResponse(todayEntries, 'today'))
  fireEvent.click(screen.getByText('วันนี้'))

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (1 รายการ)')).toBeInTheDocument()
   expect(screen.queryByText('สาขาสัปดาห์')).not.toBeInTheDocument()
  })

  expect(mockFetch).toHaveBeenCalledTimes(3) // initial + week + today
 })

 it('should show loading state during date range change', async () => {
  // Initial load - today
  mockFetch.mockResolvedValueOnce(createMockResponse(todayEntries, 'today'))
  
  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (1 รายการ)')).toBeInTheDocument()
  })

  // Mock slow response for week filter
  mockFetch.mockImplementationOnce(
   () => new Promise(resolve => 
    setTimeout(() => resolve(createMockResponse(weekEntries, 'week')), 100)
   )
  )
  
  fireEvent.click(screen.getByText('7 วันที่ผ่านมา'))

  // Should show loading state
  expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()

  // Wait for loading to complete
  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (2 รายการ)')).toBeInTheDocument()
  })
 })

 it('should preserve empty state message with correct date range', async () => {
  // Initial load - today with no data
  mockFetch.mockResolvedValueOnce(createMockResponse([], 'today'))
  
  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('ไม่มีประวัติการทำงาน')).toBeInTheDocument()
  })

  // Switch to week with no data
  mockFetch.mockResolvedValueOnce(createMockResponse([], 'week'))
  fireEvent.click(screen.getByText('7 วันที่ผ่านมา'))

  await waitFor(() => {
   expect(screen.getByText('ไม่มีประวัติการทำงาน')).toBeInTheDocument()
   // The empty state component should reflect the current date range
  })
 })

 it('should handle API errors during date range filtering', async () => {
  // Initial load - today
  mockFetch.mockResolvedValueOnce(createMockResponse(todayEntries, 'today'))
  
  render(<WorkHistoryPage />)

  await waitFor(() => {
   expect(screen.getByText('รายการทั้งหมด (1 รายการ)')).toBeInTheDocument()
  })

  // API error when switching to week
  mockFetch.mockResolvedValueOnce({
   ok: false,
   json: async () => ({
    error: 'Database connection failed'
   })
  })
  
  fireEvent.click(screen.getByText('7 วันที่ผ่านมา'))

  await waitFor(() => {
   expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument()
   expect(screen.getByText('Database connection failed')).toBeInTheDocument()
  })
 })
})