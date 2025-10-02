'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts'
import { Package, TrendingDown, DollarSign, Layers } from 'lucide-react'
import { useState } from 'react'

interface MaterialUsageData {
  name: string
  quantity: number
  cost: number
  percentage: number
  trend: number
}

interface MaterialTrendData {
  period: string
  totalCost: number
  totalQuantity: number
  topMaterials: {
    name: string
    cost: number
  }[]
}

interface MaterialUsageChartProps {
  usageData?: MaterialUsageData[]
  trendData?: MaterialTrendData[]
  isLoading?: boolean
}

const mockUsageData: MaterialUsageData[] = [
  { name: 'แป้งสาลี', quantity: 150, cost: 12000, percentage: 35, trend: +5.2 },
  { name: 'นมสด', quantity: 80, cost: 8500, percentage: 25, trend: -2.1 },
  { name: 'เนย', quantity: 25, cost: 6800, percentage: 20, trend: +8.3 },
  { name: 'น้ำตาล', quantity: 45, cost: 3200, percentage: 12, trend: +1.5 },
  { name: 'ไข่ไก่', quantity: 200, cost: 2800, percentage: 8, trend: -3.2 }
]

const mockTrendData: MaterialTrendData[] = [
  {
    period: 'สัปดาห์ 1',
    totalCost: 28500,
    totalQuantity: 450,
    topMaterials: [
      { name: 'แป้งสาลี', cost: 10500 },
      { name: 'นมสด', cost: 7800 },
      { name: 'เนย', cost: 6200 }
    ]
  },
  {
    period: 'สัปดาห์ 2',
    totalCost: 31200,
    totalQuantity: 480,
    topMaterials: [
      { name: 'แป้งสาลี', cost: 11200 },
      { name: 'นมสด', cost: 8100 },
      { name: 'เนย', cost: 6500 }
    ]
  },
  {
    period: 'สัปดาห์ 3',
    totalCost: 33800,
    totalQuantity: 520,
    topMaterials: [
      { name: 'แป้งสาลี', cost: 12000 },
      { name: 'นมสด', cost: 8500 },
      { name: 'เนย', cost: 6800 }
    ]
  },
  {
    period: 'สัปดาห์ 4',
    totalCost: 29600,
    totalQuantity: 465,
    topMaterials: [
      { name: 'แป้งสาลี', cost: 10800 },
      { name: 'นมสด', cost: 7900 },
      { name: 'เนย', cost: 6300 }
    ]
  }
]

const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#ea580c', '#7c3aed']

type ViewType = 'proportion' | 'trend' | 'cost-analysis'

export function MaterialUsageChart({ 
  usageData = mockUsageData, 
  trendData = mockTrendData,
  isLoading = false 
}: MaterialUsageChartProps) {
  const [viewType, setViewType] = useState<ViewType>('proportion')

  const totalCost = usageData.reduce((sum, item) => sum + item.cost, 0)
  const totalQuantity = usageData.reduce((sum, item) => sum + item.quantity, 0)
  const highestUsageMaterial = usageData.reduce((max, item) => 
    item.percentage > max.percentage ? item : max
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            การใช้วัตถุดิบและต้นทุน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
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
            <Package className="h-5 w-5 text-orange-600" />
            <div>
              <CardTitle>การใช้วัตถุดิบและต้นทุน</CardTitle>
              <CardDescription>
                ติดตามการใช้วัตถุดิบและต้นทุนการผลิต
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg">
              {[
                { key: 'proportion', label: 'สัดส่วน' },
                { key: 'trend', label: 'แนวโน้ม' },
                { key: 'cost-analysis', label: 'วิเคราะห์ต้นทุน' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={viewType === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewType(key as ViewType)}
                  className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
              <DollarSign className="h-3 w-3 mr-1" />
              ต้นทุนรวม: ฿{totalCost.toLocaleString()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              <Layers className="h-3 w-3 mr-1" />
              ปริมาณรวม: {totalQuantity} หน่วย
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <TrendingDown className="h-3 w-3 mr-1" />
              ใช้มากสุด: {highestUsageMaterial.name} ({highestUsageMaterial.percentage}%)
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[400px] w-full">
          {viewType === 'proportion' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Pie Chart */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-2">สัดส่วนการใช้วัตถุดิบ</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {usageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'สัดส่วน']}
                      labelFormatter={(label) => `วัตถุดิบ: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Material Details */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-2">รายละเอียดการใช้งาน</h4>
                <div className="space-y-3">
                  {usageData.map((material, index) => (
                    <div key={material.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <div className="font-medium text-sm">{material.name}</div>
                          <div className="text-xs text-gray-500">
                            {material.quantity} หน่วย • ฿{material.cost.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{material.percentage}%</div>
                        <div className={`text-xs flex items-center gap-1 ${
                          material.trend > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {material.trend > 0 ? '↑' : '↓'} {Math.abs(material.trend)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewType === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis 
                  yAxisId="cost"
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
                />
                <YAxis 
                  yAxisId="quantity"
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
                  formatter={(value, name) => {
                    if (name === 'totalCost') return [`฿${Number(value).toLocaleString()}`, 'ต้นทุนรวม']
                    if (name === 'totalQuantity') return [`${value} หน่วย`, 'ปริมาณรวม']
                    return [value, name]
                  }}
                />
                <Legend 
                  formatter={(value) => value === 'totalCost' ? 'ต้นทุนรวม' : 'ปริมาณรวม'}
                />
                <Line 
                  yAxisId="cost"
                  type="monotone" 
                  dataKey="totalCost" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  dot={{ fill: '#dc2626', strokeWidth: 2 }}
                />
                <Line 
                  yAxisId="quantity"
                  type="monotone" 
                  dataKey="totalQuantity" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {viewType === 'cost-analysis' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  width={80}
                />
                <Tooltip 
                  formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'ต้นทุน']}
                  labelFormatter={(label) => `วัตถุดิบ: ${label}`}
                />
                <Bar 
                  dataKey="cost" 
                  fill="#ea580c"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}