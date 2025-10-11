'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
 LineChart, 
 Line, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer,
 BarChart,
 Bar 
} from 'recharts'
import { Clock, Users, TrendingUp } from 'lucide-react'
import { useState } from 'react'

interface EmployeeCheckInData {
 time: string
 checkIns: number
 checkOuts: number
 activeEmployees: number
}

interface EmployeeCheckInChartProps {
 data?: EmployeeCheckInData[]
 isLoading?: boolean
}

const mockData: EmployeeCheckInData[] = [
 { time: '07:00', checkIns: 5, checkOuts: 0, activeEmployees: 5 },
 { time: '08:00', checkIns: 15, checkOuts: 0, activeEmployees: 20 },
 { time: '09:00', checkIns: 8, checkOuts: 1, activeEmployees: 27 },
 { time: '10:00', checkIns: 2, checkOuts: 0, activeEmployees: 29 },
 { time: '11:00', checkIns: 1, checkOuts: 2, activeEmployees: 28 },
 { time: '12:00', checkIns: 0, checkOuts: 15, activeEmployees: 13 },
 { time: '13:00', checkIns: 12, checkOuts: 0, activeEmployees: 25 },
 { time: '14:00', checkIns: 0, checkOuts: 3, activeEmployees: 22 },
 { time: '15:00', checkIns: 1, checkOuts: 2, activeEmployees: 21 },
 { time: '16:00', checkIns: 0, checkOuts: 5, activeEmployees: 16 },
 { time: '17:00', checkIns: 0, checkOuts: 12, activeEmployees: 4 },
 { time: '18:00', checkIns: 0, checkOuts: 4, activeEmployees: 0 }
]

type ViewMode = 'daily' | 'weekly' | 'monthly'
type ChartType = 'line' | 'bar'

export function EmployeeCheckInChart({ 
 data = mockData, 
 isLoading = false 
}: EmployeeCheckInChartProps) {
 const [viewMode, setViewMode] = useState<ViewMode>('daily')
 const [chartType, setChartType] = useState<ChartType>('line')

 const currentData = data
 const totalCheckIns = currentData.reduce((sum, item) => sum + item.checkIns, 0)
 const totalCheckOuts = currentData.reduce((sum, item) => sum + item.checkOuts, 0)
 const peakActive = Math.max(...currentData.map(item => item.activeEmployees))

 if (isLoading) {
  return (
   <Card>
    <CardHeader>
     <CardTitle className="flex items-center gap-2">
      <Clock className="h-5 w-5 text-blue-600" />
      การเช็คอิน/เช็คเอาท์ของพนักงาน
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className="h-[300px] flex items-center justify-center">
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
      <Clock className="h-5 w-5 text-blue-600" />
      <div>
       <CardTitle>การเช็คอิน/เช็คเอาท์ของพนักงาน</CardTitle>
       <CardDescription>
        ติดตามการเข้า-ออกงานของพนักงานแบบเรียลไทม์
       </CardDescription>
      </div>
     </div>
     
     <div className="flex items-center gap-2">
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
        variant={chartType === 'line' ? "default" : "ghost"}
        size="sm"
        onClick={() => setChartType('line')}
        className="rounded-none rounded-l-lg"
       >
        เส้น
       </Button>
       <Button
        variant={chartType === 'bar' ? "default" : "ghost"}
        size="sm"
        onClick={() => setChartType('bar')}
        className="rounded-none rounded-r-lg"
       >
        แท่ง
       </Button>
      </div>
     </div>
    </div>

    {/* Quick Stats */}
    <div className="flex items-center gap-4 mt-4">
     <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
       <Users className="h-3 w-3 mr-1" />
       เช็คอิน: {totalCheckIns}
      </Badge>
     </div>
     <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
       <TrendingUp className="h-3 w-3 mr-1" />
       เช็คเอาท์: {totalCheckOuts}
      </Badge>
     </div>
     <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
       สูงสุด: {peakActive} คน
      </Badge>
     </div>
    </div>
   </CardHeader>

   <CardContent>
    <div className="h-[300px] w-full">
     <ResponsiveContainer width="100%" height="100%">
      {chartType === 'line' ? (
       <LineChart data={currentData}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
         dataKey="time" 
         tick={{ fontSize: 12 }}
         className="text-muted-foreground"
         axisLine={false}
         tickLine={false}
        />
        <YAxis 
         tick={{ fontSize: 12 }}
         className="text-muted-foreground"
         axisLine={false}
         tickLine={false}
        />
        <Tooltip 
         contentStyle={{
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          fontSize: '12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
         }}
         labelFormatter={(label) => `เวลา: ${label}`}
         formatter={(value, name) => [
          value,
          name === 'checkIns' ? 'เช็คอิน' : 
          name === 'checkOuts' ? 'เช็คเอาท์' : 'พนักงานที่ทำงาน'
         ]}
        />
        <Line 
         type="monotone" 
         dataKey="checkIns" 
         stroke="#16a34a" 
         strokeWidth={2}
         dot={{ fill: '#16a34a', strokeWidth: 2 }}
         name="checkIns"
        />
        <Line 
         type="monotone" 
         dataKey="checkOuts" 
         stroke="#dc2626" 
         strokeWidth={2}
         dot={{ fill: '#dc2626', strokeWidth: 2 }}
         name="checkOuts"
        />
        <Line 
         type="monotone" 
         dataKey="activeEmployees" 
         stroke="#2563eb" 
         strokeWidth={2}
         dot={{ fill: '#2563eb', strokeWidth: 2 }}
         name="activeEmployees"
        />
       </LineChart>
      ) : (
       <BarChart data={currentData}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
         dataKey="time" 
         tick={{ fontSize: 12 }}
         className="text-muted-foreground"
         axisLine={false}
         tickLine={false}
        />
        <YAxis 
         tick={{ fontSize: 12 }}
         className="text-muted-foreground"
         axisLine={false}
         tickLine={false}
        />
        <Tooltip 
         contentStyle={{
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          fontSize: '12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
         }}
         labelFormatter={(label) => `เวลา: ${label}`}
         formatter={(value, name) => [
          value,
          name === 'checkIns' ? 'เช็คอิน' : 
          name === 'checkOuts' ? 'เช็คเอาท์' : 'พนักงานที่ทำงาน'
         ]}
        />
        <Bar dataKey="checkIns" fill="#16a34a" name="checkIns" />
        <Bar dataKey="checkOuts" fill="#dc2626" name="checkOuts" />
        <Bar dataKey="activeEmployees" fill="#2563eb" name="activeEmployees" />
       </BarChart>
      )}
     </ResponsiveContainer>
    </div>
   </CardContent>
  </Card>
 )
}