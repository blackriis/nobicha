'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts'
import { TrendingUp, Building2, DollarSign, Filter } from 'lucide-react'
import { useState } from 'react'

interface SalesData {
  period: string
  branch: string
  sales: number
  orders: number
  avgOrderValue: number
}

interface SalesAnalyticsChartProps {
  data?: SalesData[]
  isLoading?: boolean
}

const mockData: SalesData[] = [
  { period: 'วันจันทร์', branch: 'สาขาหลัก', sales: 85000, orders: 45, avgOrderValue: 1889 },
  { period: 'วันจันทร์', branch: 'สาขาสยาม', sales: 72000, orders: 38, avgOrderValue: 1895 },
  { period: 'วันจันทร์', branch: 'สาขาสีลม', sales: 68000, orders: 35, avgOrderValue: 1943 },
  { period: 'วันอังคาร', branch: 'สาขาหลัก', sales: 92000, orders: 52, avgOrderValue: 1769 },
  { period: 'วันอังคาร', branch: 'สาขาสยาม', sales: 78000, orders: 41, avgOrderValue: 1902 },
  { period: 'วันอังคาร', branch: 'สาขาสีลม', sales: 71000, orders: 37, avgOrderValue: 1919 },
  { period: 'วันพุธ', branch: 'สาขาหลัก', sales: 88000, orders: 48, avgOrderValue: 1833 },
  { period: 'วันพุธ', branch: 'สาขาสยาม', sales: 75000, orders: 39, avgOrderValue: 1923 },
  { period: 'วันพุธ', branch: 'สาขาสีลม', sales: 69000, orders: 36, avgOrderValue: 1917 },
  { period: 'วันพฤหัสบดี', branch: 'สาขาหลัก', sales: 95000, orders: 54, avgOrderValue: 1759 },
  { period: 'วันพฤหัสบดี', branch: 'สาขาสยาม', sales: 82000, orders: 43, avgOrderValue: 1907 },
  { period: 'วันพฤหัสบดี', branch: 'สาขาสีลม', sales: 74000, orders: 38, avgOrderValue: 1947 },
  { period: 'วันศุกร์', branch: 'สาขาหลัก', sales: 110000, orders: 62, avgOrderValue: 1774 },
  { period: 'วันศุกร์', branch: 'สาขาสยาม', sales: 95000, orders: 49, avgOrderValue: 1939 },
  { period: 'วันศุกร์', branch: 'สาขาสีลม', sales: 87000, orders: 44, avgOrderValue: 1977 }
]

const branches = ['ทั้งหมด', 'สาขาหลัก', 'สาขาสยาม', 'สาขาสีลม']
type ViewMode = 'daily' | 'weekly' | 'monthly'
type ChartType = 'bar' | 'area'

export function SalesAnalyticsChart({ 
  data = mockData, 
  isLoading = false 
}: SalesAnalyticsChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [selectedBranch, setSelectedBranch] = useState<string>('ทั้งหมด')

  // Transform data for chart display
  const chartData = selectedBranch === 'ทั้งหมด' 
    ? data.reduce((acc, item) => {
        const existing = acc.find(a => a.period === item.period)
        if (existing) {
          existing.sales += item.sales
          existing.orders += item.orders
        } else {
          acc.push({ 
            period: item.period, 
            sales: item.sales, 
            orders: item.orders,
            avgOrderValue: item.avgOrderValue 
          })
        }
        return acc
      }, [] as any[])
    : data.filter(item => item.branch === selectedBranch)

  const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0)
  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0)
  const avgOrderValue = totalSales / totalOrders

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            ยอดขายตามสาขา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>ยอดขายตามสาขา</CardTitle>
              <CardDescription>
                วิเคราะห์ยอดขายและคำสั่งซื้อแยกตามสาขา
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Branch Filter */}
            <div className="flex items-center border rounded-lg">
              <Filter className="h-4 w-4 ml-2 text-gray-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-2 py-1 text-sm bg-transparent border-none outline-none"
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg">
              {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                >
                  {mode === 'daily' ? 'รายวัน' : mode === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                </Button>
              ))}
            </div>
            
            {/* Chart Type Toggle */}
            <div className="flex items-center border rounded-lg">
              <Button
                variant={chartType === 'bar' ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType('bar')}
                className="rounded-none rounded-l-lg"
              >
                แท่ง
              </Button>
              <Button
                variant={chartType === 'area' ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType('area')}
                className="rounded-none rounded-r-lg"
              >
                พื้นที่
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <DollarSign className="h-3 w-3 mr-1" />
              รวม: ฿{totalSales.toLocaleString()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              <Building2 className="h-3 w-3 mr-1" />
              คำสั่งซื้อ: {totalOrders}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
              เฉลี่ย: ฿{Math.round(avgOrderValue).toLocaleString()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  yAxisId="sales"
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
                />
                <YAxis 
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelFormatter={(label) => `${label}`}
                  formatter={(value, name) => {
                    if (name === 'sales') {
                      return [`฿${Number(value).toLocaleString()}`, 'ยอดขาย']
                    }
                    if (name === 'orders') {
                      return [`${value} คำสั่ง`, 'คำสั่งซื้อ']
                    }
                    return [value, name]
                  }}
                />
                <Legend 
                  formatter={(value) => value === 'sales' ? 'ยอดขาย' : 'คำสั่งซื้อ'}
                />
                <Bar 
                  yAxisId="sales" 
                  dataKey="sales" 
                  fill="#16a34a" 
                  name="sales"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="orders" 
                  dataKey="orders" 
                  fill="#2563eb" 
                  name="orders"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelFormatter={(label) => `${label}`}
                  formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'ยอดขาย']}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#16a34a" 
                  fill="#16a34a" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}