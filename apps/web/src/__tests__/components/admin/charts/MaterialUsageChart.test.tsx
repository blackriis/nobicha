import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { MaterialUsageChart } from '@/components/admin/charts/MaterialUsageChart'

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
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
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

const mockUsageData = [
  { name: 'แป้งสาลี', quantity: 100, cost: 5000, percentage: 50, trend: +2.5 },
  { name: 'นมสด', quantity: 50, cost: 3000, percentage: 30, trend: -1.2 },
  { name: 'เนย', quantity: 25, cost: 2000, percentage: 20, trend: +5.0 }
]

const mockTrendData = [
  { period: 'สัปดาห์ 1', totalCost: 8000, totalQuantity: 150, topMaterials: [] },
  { period: 'สัปดาห์ 2', totalCost: 9000, totalQuantity: 160, topMaterials: [] }
]

describe('MaterialUsageChart', () => {
  it('renders chart title and description correctly', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    expect(screen.getByText('การใช้วัตถุดิบและต้นทุน')).toBeInTheDocument()
    expect(screen.getByText('ติดตามการใช้วัตถุดิบและต้นทุนการผลิต')).toBeInTheDocument()
  })

  it('shows loading state when isLoading is true', () => {
    render(<MaterialUsageChart isLoading={true} />)
    
    expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
    expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument()
  })

  it('displays quick stats badges correctly', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    expect(screen.getByText(/ต้นทุนรวม: ฿10,000/)).toBeInTheDocument()
    expect(screen.getByText(/ปริมาณรวม: 175 หน่วย/)).toBeInTheDocument()
    expect(screen.getByText(/ใช้มากสุด: แป้งสาลี \(50%\)/)).toBeInTheDocument()
  })

  it('renders view type toggle buttons', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    expect(screen.getByText('สัดส่วน')).toBeInTheDocument()
    expect(screen.getByText('แนวโน้ม')).toBeInTheDocument()
    expect(screen.getByText('วิเคราะห์ต้นทุน')).toBeInTheDocument()
  })

  it('defaults to proportion view', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByText('สัดส่วนการใช้วัตถุดิบ')).toBeInTheDocument()
    expect(screen.getByText('รายละเอียดการใช้งาน')).toBeInTheDocument()
  })

  it('switches to trend view when trend button is clicked', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    const trendButton = screen.getByText('แนวโน้ม')
    fireEvent.click(trendButton)
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
  })

  it('switches to cost analysis view when cost analysis button is clicked', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    const costAnalysisButton = screen.getByText('วิเคราะห์ต้นทุน')
    fireEvent.click(costAnalysisButton)
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
  })

  it('displays material details in proportion view', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    expect(screen.getByText('แป้งสาลี')).toBeInTheDocument()
    expect(screen.getByText('100 หน่วย • ฿5,000')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    
    expect(screen.getByText('นมสด')).toBeInTheDocument()
    expect(screen.getByText('50 หน่วย • ฿3,000')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    
    expect(screen.getByText('เนย')).toBeInTheDocument()
    expect(screen.getByText('25 หน่วย • ฿2,000')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('displays trend indicators correctly', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    expect(screen.getByText('↑ 2.5%')).toBeInTheDocument() // แป้งสาลี
    expect(screen.getByText('↓ 1.2%')).toBeInTheDocument() // นมสด  
    expect(screen.getByText('↑ 5%')).toBeInTheDocument()   // เนย
  })

  it('renders responsive container', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('renders with default mock data when no data provided', () => {
    render(<MaterialUsageChart />)
    
    expect(screen.getByText('การใช้วัตถุดิบและต้นทุน')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('calculates totals correctly', () => {
    const testData = [
      { name: 'วัตถุดิบ A', quantity: 10, cost: 1000, percentage: 40, trend: 0 },
      { name: 'วัตถุดิบ B', quantity: 15, cost: 1500, percentage: 60, trend: 0 }
    ]
    
    render(<MaterialUsageChart usageData={testData} trendData={mockTrendData} />)
    
    expect(screen.getByText(/ต้นทุนรวม: ฿2,500/)).toBeInTheDocument()
    expect(screen.getByText(/ปริมาณรวม: 25 หน่วย/)).toBeInTheDocument()
    expect(screen.getByText(/ใช้มากสุด: วัตถุดิบ B \(60%\)/)).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    render(<MaterialUsageChart usageData={[]} trendData={[]} />)
    
    expect(screen.getByText('การใช้วัตถุดิบและต้นทุน')).toBeInTheDocument()
    expect(screen.getByText(/ต้นทุนรวม: ฿0/)).toBeInTheDocument()
    expect(screen.getByText(/ปริมาณรวม: 0 หน่วย/)).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    expect(screen.getByRole('button', { name: /สัดส่วน/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /แนวโน้ม/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /วิเคราะห์ต้นทุน/ })).toBeInTheDocument()
  })

  it('shows color indicators for materials', () => {
    render(<MaterialUsageChart usageData={mockUsageData} trendData={mockTrendData} />)
    
    // Should have color indicator divs for each material
    const colorIndicators = screen.getAllByRole('generic').filter(
      el => el.className?.includes('w-4 h-4 rounded')
    )
    expect(colorIndicators).toHaveLength(mockUsageData.length)
  })
})