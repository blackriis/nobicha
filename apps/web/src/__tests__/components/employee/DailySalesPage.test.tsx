import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useAuth } from '@/components/auth/AuthProvider'
import { timeEntryService } from '@/lib/services/time-entry.service'
import { SalesReportsService } from '@/lib/services/sales-reports.service'
import DailySalesPage from '@/app/dashboard/daily-sales/page'

// Mock dependencies
vi.mock('@/components/auth/AuthProvider')
vi.mock('@/lib/services/time-entry.service')
vi.mock('@/lib/services/sales-reports.service')
vi.mock('@/lib/supabase', () => ({
 createClient: vi.fn(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(() => ({
   select: vi.fn(() => ({ eq: vi.fn(), single: vi.fn() }))
  }))
 })),
 createSupabaseClientSide: vi.fn(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(() => ({
   select: vi.fn(() => ({ eq: vi.fn(), single: vi.fn() }))
  }))
 }))
}))
vi.mock('next/navigation', () => ({
 useRouter: () => ({
  push: vi.fn(),
 }),
}))

const mockUseAuth = vi.mocked(useAuth)
const mockTimeEntryService = vi.mocked(timeEntryService)
const mockSalesReportsService = vi.mocked(SalesReportsService)

describe('DailySalesPage UI Updates for Story 2.3.1', () => {
 beforeEach(() => {
  vi.clearAllMocks()
  
  // Mock user with auth
  mockUseAuth.mockReturnValue({
   user: {
    id: 'test-user-id',
    email: 'test@test.com',
    role: 'employee',
    home_branch: {
     id: 'home-branch-1',
     name: 'สาขาบ้าน'
    }
   } as any,
   loading: false
  } as any)
 })

 afterEach(() => {
  vi.resetAllMocks()
 })

 it('should show check-in required message when no check-in exists', async () => {
  // Mock no check-in scenario
  mockTimeEntryService.getTodaysLatestCheckInBranch.mockResolvedValue({
   success: false,
   error: 'กรุณาเช็คอินที่สาขาก่อนทำการรายงานยอดขาย'
  })

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(screen.getByText('ต้องเช็คอินก่อน')).toBeInTheDocument()
   expect(screen.getByText('กรุณาเช็คอินที่สาขาก่อนทำการรายงานยอดขาย')).toBeInTheDocument()
   expect(screen.getByText(/กรุณาไปหน้า.*เช็คอิน\/เช็คเอาท์/)).toBeInTheDocument()
  })
 })

 it('should show check-in branch instead of home branch when checked in', async () => {
  // Mock successful check-in
  mockTimeEntryService.getTodaysLatestCheckInBranch.mockResolvedValue({
   success: true,
   data: {
    branchId: 'checkin-branch-2',
    branchName: 'สาขาเช็คอิน',
    checkInTime: '2025-09-15T09:30:00Z'
   }
  })

  // Mock sales report service
  mockSalesReportsService.getTodaysReport.mockResolvedValue({
   success: true,
   data: []
  })

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(screen.getByText('เช็คอินแล้ว - สาขาเช็คอิน')).toBeInTheDocument()
   expect(screen.getByText(/เช็คอินเมื่อ.*น\./)).toBeInTheDocument()
   expect(screen.getByText('วันที่')).toBeInTheDocument()
   expect(screen.getByText(/สาขาเช็คอิน/)).toBeInTheDocument()
  })
 })

 it('should show ready to report status when checked in but not reported', async () => {
  // Mock successful check-in
  mockTimeEntryService.getTodaysLatestCheckInBranch.mockResolvedValue({
   success: true,
   data: {
    branchId: 'checkin-branch-2',
    branchName: 'สาขาเช็คอิน',
    checkInTime: '2025-09-15T09:30:00Z'
   }
  })

  // Mock no report yet
  mockSalesReportsService.getTodaysReport.mockResolvedValue({
   success: true,
   data: []
  })

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(screen.getByText('พร้อมรายงานยอดขาย')).toBeInTheDocument()
   expect(screen.getByText('กรุณากรอกยอดขายรวมและแนบสลิปยืนยัน')).toBeInTheDocument()
  })
 })

 it('should show completed status when already reported', async () => {
  // Mock successful check-in
  mockTimeEntryService.getTodaysLatestCheckInBranch.mockResolvedValue({
   success: true,
   data: {
    branchId: 'checkin-branch-2',
    branchName: 'สาขาเช็คอิน',
    checkInTime: '2025-09-15T09:30:00Z'
   }
  })

  // Mock existing report
  mockSalesReportsService.getTodaysReport.mockResolvedValue({
   success: true,
   data: [{
    id: 'report-1',
    total_sales: 1000,
    report_date: '2025-09-15'
   }] as any
  })

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(screen.getByText('รายงานยอดขายสำเร็จแล้ว')).toBeInTheDocument()
   expect(screen.getByText('คุณได้ทำการรายงานยอดขายสำหรับวันนี้เรียบร้อยแล้ว')).toBeInTheDocument()
  })
 })

 it('should handle check-in service error gracefully', async () => {
  // Mock service error
  mockTimeEntryService.getTodaysLatestCheckInBranch.mockRejectedValue(
   new Error('เกิดข้อผิดพลาดในการตรวจสอบสถานะเช็คอิน')
  )

  render(<DailySalesPage />)

  await waitFor(() => {
   expect(screen.getByText('ต้องเช็คอินก่อน')).toBeInTheDocument()
   expect(screen.getByText('เกิดข้อผิดพลาดในการตรวจสอบสถานะเช็คอิน')).toBeInTheDocument()
  })
 })
})