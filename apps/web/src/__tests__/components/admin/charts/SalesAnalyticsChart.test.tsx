import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { SalesAnalyticsChart } from '@/components/admin/charts/SalesAnalyticsChart'

// Setup JSDOM for ResizeObserver
beforeAll(() => {
 global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
 }))
})

// Mock recharts
vi.mock('recharts', () => ({
 BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
 AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
 Bar: () => <div data-testid="bar" />,
 Area: () => <div data-testid="area" />,
 XAxis: () => <div data-testid="x-axis" />,
 YAxis: () => <div data-testid="y-axis" />,
 CartesianGrid: () => <div data-testid="cartesian-grid" />,
 Tooltip: () => <div data-testid="tooltip" />,
 Legend: () => <div data-testid="legend" />,
 ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
  <div data-testid="responsive-container">{children}</div>
 )
}))

const mockData = [
 { period: 'วันจันทร์', branch: 'สาขาหลัก', sales: 100000, orders: 50, avgOrderValue: 2000 },
 { period: 'วันจันทร์', branch: 'สาขาสยาม', sales: 80000, orders: 40, avgOrderValue: 2000 },
 { period: 'วันอังคาร', branch: 'สาขาหลัก', sales: 120000, orders: 60, avgOrderValue: 2000 },
 { period: 'วันอังคาร', branch: 'สาขาสยาม', sales: 90000, orders: 45, avgOrderValue: 2000 }
]

describe('SalesAnalyticsChart', () => {
 it('renders chart title and description correctly', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  expect(screen.getByText('ยอดขายตามสาขา')).toBeInTheDocument()
  expect(screen.getByText('วิเคราะห์ยอดขายและคำสั่งซื้อแยกตามสาขา')).toBeInTheDocument()
 })

 it('shows loading state when isLoading is true', () => {
  render(<SalesAnalyticsChart isLoading={true} />)
  
  expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
  expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument()
 })

 it('displays quick stats badges correctly', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  expect(screen.getByText(/รวม: ฿390,000/)).toBeInTheDocument()
  expect(screen.getByText(/คำสั่งซื้อ: 195/)).toBeInTheDocument()
  expect(screen.getByText(/เฉลี่ย: ฿2,000/)).toBeInTheDocument()
 })

 it('renders branch filter dropdown', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  const select = screen.getByRole('combobox')
  expect(select).toBeInTheDocument()
  expect(select).toHaveValue('ทั้งหมด')
 })

 it('renders view mode toggle buttons', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  expect(screen.getByText('รายวัน')).toBeInTheDocument()
  expect(screen.getByText('รายสัปดาห์')).toBeInTheDocument()
  expect(screen.getByText('รายเดือน')).toBeInTheDocument()
 })

 it('renders chart type toggle buttons', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  expect(screen.getByText('แท่ง')).toBeInTheDocument()
  expect(screen.getByText('พื้นที่')).toBeInTheDocument()
 })

 it('defaults to bar chart', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
 })

 it('switches to area chart when area button is clicked', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  const areaButton = screen.getByText('พื้นที่')
  fireEvent.click(areaButton)
  
  expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
 })

 it('filters data by branch when branch is selected', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  const select = screen.getByRole('combobox')
  fireEvent.change(select, { target: { value: 'สาขาหลัก' } })
  
  expect(select).toHaveValue('สาขาหลัก')
  // Should show only filtered branch stats
  expect(screen.getByText(/รวม: ฿220,000/)).toBeInTheDocument()
  expect(screen.getByText(/คำสั่งซื้อ: 110/)).toBeInTheDocument()
 })

 it('aggregates data correctly when "ทั้งหมด" is selected', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  // Default should be "ทั้งหมด" and show aggregated data
  expect(screen.getByText(/รวม: ฿390,000/)).toBeInTheDocument()
  expect(screen.getByText(/คำสั่งซื้อ: 195/)).toBeInTheDocument()
  expect(screen.getByText(/เฉลี่ย: ฿2,000/)).toBeInTheDocument()
 })

 it('changes view mode when buttons are clicked', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  const weeklyButton = screen.getByText('รายสัปดาห์')
  fireEvent.click(weeklyButton)
  
  // The button should be active (default variant)
  expect(weeklyButton).toHaveAttribute('data-variant', 'default')
 })

 it('renders responsive container', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
 })

 it('renders with default mock data when no data provided', () => {
  render(<SalesAnalyticsChart />)
  
  expect(screen.getByText('ยอดขายตามสาขา')).toBeInTheDocument()
  expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
 })

 it('handles empty data gracefully', () => {
  render(<SalesAnalyticsChart data={[]} />)
  
  expect(screen.getByText('ยอดขายตามสาขา')).toBeInTheDocument()
  expect(screen.getByText(/รวม: ฿0/)).toBeInTheDocument()
  expect(screen.getByText(/คำสั่งซื้อ: 0/)).toBeInTheDocument()
 })

 it('calculates average order value correctly', () => {
  const testData = [
   { period: 'วันจันทร์', branch: 'สาขาหลัก', sales: 60000, orders: 30, avgOrderValue: 2000 }
  ]
  
  render(<SalesAnalyticsChart data={testData} />)
  
  expect(screen.getByText(/เฉลี่ย: ฿2,000/)).toBeInTheDocument()
 })

 it('has proper accessibility attributes', () => {
  render(<SalesAnalyticsChart data={mockData} />)
  
  expect(screen.getByRole('combobox')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /รายวัน/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /แท่ง/ })).toBeInTheDocument()
 })
})