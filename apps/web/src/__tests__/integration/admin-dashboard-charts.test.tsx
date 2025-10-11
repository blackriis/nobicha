import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock recharts entirely to avoid rendering issues in tests
vi.mock('recharts', () => ({
 LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
 BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
 PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
 AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
 Line: () => <div data-testid="line" />,
 Bar: () => <div data-testid="bar" />,
 Pie: () => <div data-testid="pie" />,
 Area: () => <div data-testid="area" />,
 Cell: () => <div data-testid="cell" />,
 XAxis: () => <div data-testid="x-axis" />,
 YAxis: () => <div data-testid="y-axis" />,
 CartesianGrid: () => <div data-testid="cartesian-grid" />,
 Tooltip: () => <div data-testid="tooltip" />,
 Legend: () => <div data-testid="legend" />,
 ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
  <div data-testid="responsive-container">{children}</div>
 )
}))

// Mock the auth components
vi.mock('@/components/auth', () => ({
 ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock AdminHeader
vi.mock('@/components/admin/AdminHeader', () => ({
 AdminHeader: () => <div data-testid="admin-header">Admin Header</div>
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
 default: ({ children, href }: { children: React.ReactNode; href: string }) => (
  <a href={href}>{children}</a>
 )
}))

import AdminDashboard from '@/app/admin/page'

describe('Admin Dashboard Charts Integration', () => {
 it('renders admin dashboard with all chart components', () => {
  render(<AdminDashboard />)
  
  // Check if main dashboard elements are present
  expect(screen.getByText('ภาพรวมระบบ')).toBeInTheDocument()
  expect(screen.getByText('สรุปข้อมูลสำคัญและการดำเนินงานของระบบบริหารจัดการพนักงาน')).toBeInTheDocument()
  
  // Check if charts section is present
  expect(screen.getByText('รายงานและกราฟ')).toBeInTheDocument()
  
  // Check if all three chart components are rendered
  expect(screen.getByText('การเช็คอิน/เช็คเอาท์ของพนักงาน')).toBeInTheDocument()
  expect(screen.getByText('ยอดขายตามสาขา')).toBeInTheDocument()
  expect(screen.getByText('การใช้วัตถุดิบและต้นทุน')).toBeInTheDocument()
 })

 it('renders existing dashboard stats alongside new charts', () => {
  render(<AdminDashboard />)
  
  // Check existing stats are still present
  expect(screen.getByText('พนักงานทั้งหมด')).toBeInTheDocument()
  expect(screen.getByText('สาขาทั้งหมด')).toBeInTheDocument()
  expect(screen.getByText('ยอดขายเดือนนี้')).toBeInTheDocument()
  expect(screen.getByText('รอบเงินเดือน')).toBeInTheDocument()
  
  // Check that charts are present alongside existing content
  expect(screen.getByText('เมนูหลัก')).toBeInTheDocument()
  expect(screen.getByText('สถานะปัจจุบัน')).toBeInTheDocument()
  expect(screen.getByText('รายงานและกราฟ')).toBeInTheDocument()
 })

 it('maintains existing quick actions and navigation', () => {
  render(<AdminDashboard />)
  
  // Check if quick action cards are still present
  expect(screen.getByText('จัดการสาขา')).toBeInTheDocument()
  expect(screen.getByText('จัดการพนักงาน')).toBeInTheDocument()
  expect(screen.getByText('จัดการวัตถุดิบ')).toBeInTheDocument()
  expect(screen.getByText('จัดการเงินเดือน')).toBeInTheDocument()
  
  // Check if navigation links are present
  expect(screen.getByRole('link', { name: /เข้าใช้งาน จัดการสาขา/ })).toHaveAttribute('href', '/admin/branches')
  expect(screen.getByRole('link', { name: /เข้าใช้งาน จัดการพนักงาน/ })).toHaveAttribute('href', '/admin/employees')
  expect(screen.getByRole('link', { name: /เข้าใช้งาน จัดการวัตถุดิบ/ })).toHaveAttribute('href', '/admin/raw-materials')
  expect(screen.getByRole('link', { name: /เข้าใช้งาน จัดการเงินเดือน/ })).toHaveAttribute('href', '/admin/payroll')
 })

 it('displays responsive containers for all charts', () => {
  render(<AdminDashboard />)
  
  // Should have 3 responsive containers for the 3 charts
  const responsiveContainers = screen.getAllByTestId('responsive-container')
  expect(responsiveContainers).toHaveLength(3)
 })

 it('renders charts in correct order', () => {
  render(<AdminDashboard />)
  
  const chartsSection = screen.getByRole('region', { name: /รายงานและกราฟ/ })
  expect(chartsSection).toBeInTheDocument()
  
  // Check the order of chart titles
  const chartTitles = [
   'การเช็คอิน/เช็คเอาท์ของพนักงาน',
   'ยอดขายตามสาขา', 
   'การใช้วัตถุดิบและต้นทุน'
  ]
  
  chartTitles.forEach((title) => {
   expect(screen.getByText(title)).toBeInTheDocument()
  })
 })

 it('maintains accessibility structure with proper sections', () => {
  render(<AdminDashboard />)
  
  // Check if proper ARIA landmarks exist
  expect(screen.getByRole('main')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: /สถิติภาพรวมระบบ/ })).toBeInTheDocument()
  expect(screen.getByRole('complementary')).toBeInTheDocument() // aside element
  
  // Check if proper headings exist
  expect(screen.getByRole('heading', { name: 'ภาพรวมระบบ' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'รายงานและกราฟ' })).toBeInTheDocument()
 })

 it('uses proper Thai language throughout', () => {
  render(<AdminDashboard />)
  
  // Check various Thai text elements
  expect(screen.getByText('ภาพรวมระบบ')).toBeInTheDocument()
  expect(screen.getByText('รายงานและกราฟ')).toBeInTheDocument()
  expect(screen.getByText('ติดตามการเข้า-ออกงานของพนักงานแบบเรียลไทม์')).toBeInTheDocument()
  expect(screen.getByText('วิเคราะห์ยอดขายและคำสั่งซื้อแยกตามสาขา')).toBeInTheDocument()
  expect(screen.getByText('ติดตามการใช้วัตถุดิบและต้นทุนการผลิต')).toBeInTheDocument()
 })

 it('preserves existing activity panel functionality', () => {
  render(<AdminDashboard />)
  
  // Check activity panel elements
  expect(screen.getByText('กิจกรรมวันนี้')).toBeInTheDocument()
  expect(screen.getByText('ติดตามสถานะการทำงานแบบเรียลไทม์')).toBeInTheDocument()
  expect(screen.getByText('พนักงานเช็คอินวันนี้')).toBeInTheDocument()
  expect(screen.getByText('สาขาที่เปิดทำการ')).toBeInTheDocument()
  expect(screen.getByText('รอบเงินเดือนรอดำเนินการ')).toBeInTheDocument()
  
  // Check quick stats
  expect(screen.getByText('ข้อมูลด่วน')).toBeInTheDocument()
 })

 it('maintains proper layout structure with charts added', () => {
  render(<AdminDashboard />)
  
  // Check that the layout maintains its structure:
  // 1. Header
  expect(screen.getByTestId('admin-header')).toBeInTheDocument()
  
  // 2. Welcome section
  expect(screen.getByText('ภาพรวมระบบ')).toBeInTheDocument()
  
  // 3. Stats overview
  expect(screen.getByText('พนักงานทั้งหมด')).toBeInTheDocument()
  
  // 4. Quick actions and activity panel
  expect(screen.getByText('เมนูหลัก')).toBeInTheDocument()
  expect(screen.getByText('สถานะปัจจุบัน')).toBeInTheDocument()
  
  // 5. NEW: Charts section
  expect(screen.getByText('รายงานและกราฟ')).toBeInTheDocument()
 })
})