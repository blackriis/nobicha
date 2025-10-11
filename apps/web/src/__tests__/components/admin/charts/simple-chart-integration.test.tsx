import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'

// Setup JSDOM and ResizeObserver
beforeAll(() => {
 global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
 }))
})

// Mock lucide-react icons as simple divs
vi.mock('lucide-react', () => {
 const createIcon = (name: string) => ({ className, ...props }: any) => 
  <div data-testid={`icon-${name.toLowerCase()}`} className={className} {...props} />
 
 return {
  Clock: createIcon('Clock'),
  Users: createIcon('Users'),
  TrendingUp: createIcon('TrendingUp'),
  TrendingDown: createIcon('TrendingDown'),
  Building2: createIcon('Building2'),
  DollarSign: createIcon('DollarSign'),
  Package: createIcon('Package'),
  Layers: createIcon('Layers'),
  Filter: createIcon('Filter')
 }
})

// Mock recharts as simple divs
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

import { EmployeeCheckInChart } from '@/components/admin/charts/EmployeeCheckInChart'
import { SalesAnalyticsChart } from '@/components/admin/charts/SalesAnalyticsChart'
import { MaterialUsageChart } from '@/components/admin/charts/MaterialUsageChart'

const mockEmployeeData = [
 { time: '08:00', checkIns: 10, checkOuts: 0, activeEmployees: 10 },
 { time: '17:00', checkIns: 0, checkOuts: 10, activeEmployees: 0 }
]

const mockSalesData = [
 { period: 'วันจันทร์', branch: 'สาขาหลัก', sales: 100000, orders: 50, avgOrderValue: 2000 }
]

const mockMaterialData = [
 { name: 'แป้งสาลี', quantity: 100, cost: 5000, percentage: 50, trend: +2.5 }
]

const mockTrendData = [
 { period: 'สัปดาห์ 1', totalCost: 8000, totalQuantity: 150, topMaterials: [] }
]

describe('Chart Components Integration', () => {
 describe('EmployeeCheckInChart', () => {
  it('renders successfully with basic functionality', () => {
   render(<EmployeeCheckInChart data={mockEmployeeData} />)
   
   expect(screen.getByText('การเช็คอิน/เช็คเอาท์ของพนักงาน')).toBeInTheDocument()
   expect(screen.getByText('รายวัน')).toBeInTheDocument()
   expect(screen.getByText('เส้น')).toBeInTheDocument()
   expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('shows loading state', () => {
   render(<EmployeeCheckInChart isLoading={true} />)
   expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
  })
 })

 describe('SalesAnalyticsChart', () => {
  it('renders successfully with basic functionality', () => {
   render(<SalesAnalyticsChart data={mockSalesData} />)
   
   expect(screen.getByText('ยอดขายตามสาขา')).toBeInTheDocument()
   expect(screen.getByText('รายวัน')).toBeInTheDocument()
   expect(screen.getByText('แท่ง')).toBeInTheDocument()
   expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('shows loading state', () => {
   render(<SalesAnalyticsChart isLoading={true} />)
   expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
  })
 })

 describe('MaterialUsageChart', () => {
  it('renders successfully with basic functionality', () => {
   render(<MaterialUsageChart usageData={mockMaterialData} trendData={mockTrendData} />)
   
   expect(screen.getByText('การใช้วัตถุดิบและต้นทุน')).toBeInTheDocument()
   expect(screen.getByText('สัดส่วน')).toBeInTheDocument()
   expect(screen.getByText('แนวโน้ม')).toBeInTheDocument()
   expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('shows loading state', () => {
   render(<MaterialUsageChart isLoading={true} />)
   expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
  })
 })

 describe('All Charts Accessibility', () => {
  it('have proper Thai language content', () => {
   const { container: container1 } = render(<EmployeeCheckInChart data={mockEmployeeData} />)
   const { container: container2 } = render(<SalesAnalyticsChart data={mockSalesData} />)
   const { container: container3 } = render(<MaterialUsageChart usageData={mockMaterialData} trendData={mockTrendData} />)
   
   expect(container1.textContent).toMatch(/การเช็คอิน/)
   expect(container2.textContent).toMatch(/ยอดขาย/)
   expect(container3.textContent).toMatch(/วัตถุดิบ/)
  })

  it('render responsive containers for all charts', () => {
   render(<EmployeeCheckInChart data={mockEmployeeData} />)
   render(<SalesAnalyticsChart data={mockSalesData} />)
   render(<MaterialUsageChart usageData={mockMaterialData} trendData={mockTrendData} />)
   
   const containers = screen.getAllByTestId('responsive-container')
   expect(containers).toHaveLength(3)
  })
 })
})