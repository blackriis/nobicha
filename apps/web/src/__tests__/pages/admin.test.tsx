/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { useAuth } from '@/components/auth'
import AdminDashboard from '@/app/admin/page'

// Mock the useAuth hook
jest.mock('@/components/auth', () => ({
 useAuth: jest.fn(),
 ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 LogoutButton: () => <button>ออกจากระบบ</button>
}))

// Mock the AdminHeader component
jest.mock('@/components/admin/AdminHeader', () => ({
 AdminHeader: () => <header>Admin Header</header>
}))

// Mock Next.js Link
jest.mock('next/link', () => {
 return ({ children, href }: { children: React.ReactNode; href: string }) => (
  <a href={href}>{children}</a>
 )
})

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('Admin Dashboard', () => {
 beforeEach(() => {
  mockUseAuth.mockReturnValue({
   user: {
    id: '123',
    email: 'admin@test.com',
    profile: {
     id: '123',
     full_name: 'ผู้ดูแลระบบทดสอบ',
     role: 'admin'
    }
   },
   loading: false,
   signOut: jest.fn()
  })
 })

 afterEach(() => {
  jest.clearAllMocks()
 })

 it('should render admin dashboard with all main sections', () => {
  render(<AdminDashboard />)

  // Check for main heading
  expect(screen.getByText('ภาพรวมระบบ')).toBeInTheDocument()
  expect(screen.getByText('สรุปข้อมูลสำคัญและการดำเนินงานของระบบบริหารจัดการพนักงาน')).toBeInTheDocument()

  // Check for stats cards
  expect(screen.getByText('พนักงานทั้งหมด')).toBeInTheDocument()
  expect(screen.getByText('สาขาทั้งหมด')).toBeInTheDocument()
  expect(screen.getByText('ยอดขายเดือนนี้')).toBeInTheDocument()
  expect(screen.getByText('รอบเงินเดือน')).toBeInTheDocument()

  // Check for quick actions
  expect(screen.getByText('เมนูหลัก')).toBeInTheDocument()
  expect(screen.getByText('จัดการสาขา')).toBeInTheDocument()
  expect(screen.getByText('จัดการพนักงาน')).toBeInTheDocument()
  expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
  expect(screen.getByText('จัดการเงินเดือน')).toBeInTheDocument()

  // Check for activity section
  expect(screen.getByText('สถานะปัจจุบัน')).toBeInTheDocument()
  expect(screen.getByText('กิจกรรมวันนี้')).toBeInTheDocument()
  expect(screen.getByText('ข้อมูลด่วน')).toBeInTheDocument()
 })

 it('should render correct statistics with Thai formatting', () => {
  render(<AdminDashboard />)

  // Check for Thai formatted numbers
  expect(screen.getByText('45')).toBeInTheDocument() // Total employees
  expect(screen.getByText('8')).toBeInTheDocument() // Active branches
  expect(screen.getByText('฿2,340,000')).toBeInTheDocument() // Monthly revenue
  expect(screen.getByText('2')).toBeInTheDocument() // Pending payrolls
 })

 it('should have accessible navigation links', () => {
  render(<AdminDashboard />)

  // Check for navigation links with proper accessibility
  const branchLink = screen.getByRole('link', { name: /เข้าใช้งาน จัดการสาขา/i })
  expect(branchLink).toBeInTheDocument()
  expect(branchLink).toHaveAttribute('href', '/admin/branches')

  const employeeLink = screen.getByRole('link', { name: /เข้าใช้งาน จัดการพนักงาน/i })
  expect(employeeLink).toBeInTheDocument()
  expect(employeeLink).toHaveAttribute('href', '/admin/employees')

  const materialsLink = screen.getByRole('link', { name: /เข้าใช้งาน จัดการวัตถุดิบ/i })
  expect(materialsLink).toBeInTheDocument()
  expect(materialsLink).toHaveAttribute('href', '/admin/raw-materials')

  const payrollLink = screen.getByRole('link', { name: /เข้าใช้งาน จัดการเงินเดือน/i })
  expect(payrollLink).toBeInTheDocument()
  expect(payrollLink).toHaveAttribute('href', '/admin/payroll')
 })

 it('should have proper semantic structure and accessibility attributes', () => {
  render(<AdminDashboard />)

  // Check for main landmark
  const mainElement = screen.getByRole('main')
  expect(mainElement).toHaveAttribute('aria-label', 'แดชบอร์ดผู้ดูแลระบบ')

  // Check for section headings
  expect(screen.getByText('สถานะปัจจุบัน')).toBeInTheDocument()

  // Check for progress bars with labels
  const progressBars = screen.getAllByRole('progressbar')
  expect(progressBars.length).toBeGreaterThan(0)
 })

 it('should render activity progress with correct percentages', () => {
  render(<AdminDashboard />)

  // Check for activity progress indicators
  expect(screen.getByText('พนักงานเช็คอินวันนี้')).toBeInTheDocument()
  expect(screen.getByText('สาขาที่เปิดทำการ')).toBeInTheDocument()
  expect(screen.getByText('รอบเงินเดือนรอดำเนินการ')).toBeInTheDocument()

  // Check for percentage displays
  expect(screen.getByText('71% ความคืบหน้า')).toBeInTheDocument() // Employee check-ins
  expect(screen.getByText('100% ความคืบหน้า')).toBeInTheDocument() // Active branches
  expect(screen.getByText('40% ความคืบหน้า')).toBeInTheDocument() // Pending payrolls
 })
})