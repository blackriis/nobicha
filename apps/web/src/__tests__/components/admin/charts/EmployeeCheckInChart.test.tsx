import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { EmployeeCheckInChart } from '@/components/admin/charts/EmployeeCheckInChart'

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
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  )
}))

const mockData = [
  { time: '08:00', checkIns: 10, checkOuts: 0, activeEmployees: 10 },
  { time: '12:00', checkIns: 0, checkOuts: 8, activeEmployees: 2 },
  { time: '17:00', checkIns: 0, checkOuts: 2, activeEmployees: 0 }
]

describe('EmployeeCheckInChart', () => {
  it('renders chart title and description correctly', () => {
    render(<EmployeeCheckInChart data={mockData} />)
    
    expect(screen.getByText('การเช็คอิน/เช็คเอาท์ของพนักงาน')).toBeInTheDocument()
    expect(screen.getByText('ติดตามการเข้า-ออกงานของพนักงานแบบเรียลไทม์')).toBeInTheDocument()
  })

  it('shows loading state when isLoading is true', () => {
    render(<EmployeeCheckInChart isLoading={true} />)
    
    expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
    expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument()
  })

  it('displays quick stats badges correctly', () => {
    render(<EmployeeCheckInChart data={mockData} />)
    
    expect(screen.getByText(/เช็คอิน: 10/)).toBeInTheDocument()
    expect(screen.getByText(/เช็คเอาท์: 10/)).toBeInTheDocument()
    expect(screen.getByText(/สูงสุด: 10 คน/)).toBeInTheDocument()
  })

  it('renders view mode toggle buttons', () => {
    render(<EmployeeCheckInChart data={mockData} />)
    
    expect(screen.getByText('รายวัน')).toBeInTheDocument()
    expect(screen.getByText('รายสัปดาห์')).toBeInTheDocument()
    expect(screen.getByText('รายเดือน')).toBeInTheDocument()
  })

  it('renders chart type toggle buttons', () => {
    render(<EmployeeCheckInChart data={mockData} />)
    
    expect(screen.getByText('เส้น')).toBeInTheDocument()
    expect(screen.getByText('แท่ง')).toBeInTheDocument()
  })

  it('defaults to line chart', () => {
    render(<EmployeeCheckInChart data={mockData} />)
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('switches to bar chart when bar button is clicked', () => {
    render(<EmployeeCheckInChart data={mockData} />)
    
    const barButton = screen.getByText('แท่ง')
    fireEvent.click(barButton)
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('changes view mode when buttons are clicked', () => {
    render(<EmployeeCheckInChart data={mockData} />)
    
    const weeklyButton = screen.getByText('รายสัปดาห์')
    fireEvent.click(weeklyButton)
    
    // The button should be active (default variant)
    expect(weeklyButton).toHaveAttribute('data-variant', 'default')
  })

  it('renders responsive container', () => {
    render(<EmployeeCheckInChart data={mockData} />)
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('calculates total check-ins and check-outs correctly', () => {
    const testData = [
      { time: '08:00', checkIns: 5, checkOuts: 0, activeEmployees: 5 },
      { time: '12:00', checkIns: 0, checkOuts: 3, activeEmployees: 2 },
      { time: '17:00', checkIns: 2, checkOuts: 4, activeEmployees: 0 }
    ]
    
    render(<EmployeeCheckInChart data={testData} />)
    
    expect(screen.getByText(/เช็คอิน: 7/)).toBeInTheDocument()
    expect(screen.getByText(/เช็คเอาท์: 7/)).toBeInTheDocument()
    expect(screen.getByText(/สูงสุด: 5 คน/)).toBeInTheDocument()
  })

  it('renders with default mock data when no data provided', () => {
    render(<EmployeeCheckInChart />)
    
    expect(screen.getByText('การเช็คอิน/เช็คเอาท์ของพนักงาน')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<EmployeeCheckInChart data={mockData} />)
    
    expect(screen.getByRole('button', { name: /รายวัน/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /เส้น/ })).toBeInTheDocument()
  })
})