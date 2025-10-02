'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
// import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  Clock, 
  Building2, 
  Activity,
  ChevronRight,
  UserCheck,
  UserX,
  TrendingUp,
  Timer
} from 'lucide-react'
import type { EmployeeReport } from '@/lib/services/admin-reports.service'

interface EmployeeReportsSectionProps {
  data: {
    summary: any
    employees: EmployeeReport[]
    dateRange: any
  } | null
  isLoading?: boolean
  onViewDetails?: () => void
}

export function EmployeeReportsSection({ 
  data, 
  isLoading = false,
  onViewDetails 
}: EmployeeReportsSectionProps) {
  
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.employees || data.employees.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">รายงานพนักงาน</CardTitle>
              <p className="text-sm text-muted-foreground">
                ข้อมูลการทำงานและเวลาของพนักงาน
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ไม่มีข้อมูลพนักงานในช่วงเวลานี้</p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
                <p><strong>Debug Info:</strong></p>
                <p>Data: {data ? 'Present' : 'Missing'}</p>
                <p>Employees Array: {data?.employees ? `${data.employees.length} items` : 'Missing'}</p>
                <p>Summary: {data?.summary ? JSON.stringify(data.summary) : 'Missing'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatHours = (hours: number): string => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h} ชม. ${m} นาที`
  }

  const formatLastCheckIn = (lastCheckIn: string | null): string => {
    if (!lastCheckIn) return 'ไม่เคยเช็คอิน'
    
    const date = new Date(lastCheckIn)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours < 1) {
      return `${diffMinutes} นาทีที่แล้ว`
    } else if (diffHours < 24) {
      return `${diffHours} ชั่วโมงที่แล้ว`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} วันที่แล้ว`
    }
  }

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <UserCheck className="h-3 w-3" />
      case 'offline':
        return <UserX className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  const topEmployees = data.employees.slice(0, 10) // Show top 10 employees

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">รายงานพนักงาน</CardTitle>
              <p className="text-sm text-muted-foreground">
                ข้อมูลการทำงานและเวลาของพนักงาน (เรียงตามเช็คอินล่าสุด)
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewDetails}
            className="gap-2"
          >
            ดูรายละเอียด
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">พนักงานทั้งหมด</span>
            </div>
            <div className="text-xl font-bold text-blue-600 mt-1">
              {data.summary.totalEmployees}
            </div>
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">ชั่วโมงรวม</span>
            </div>
            <div className="text-xl font-bold text-green-600 mt-1">
              {Math.round(data.summary.totalHours)}
            </div>
          </div>
          
          <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">กำลังทำงาน</span>
            </div>
            <div className="text-xl font-bold text-orange-600 mt-1">
              {data.summary.activeEmployees}
            </div>
          </div>
          
          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">เฉลี่ย/คน</span>
            </div>
            <div className="text-xl font-bold text-purple-600 mt-1">
              {Math.round(data.summary.averageHoursPerEmployee)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {topEmployees.map((employee, index) => (
            <div 
              key={employee.userId}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Avatar with Ranking */}
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 font-medium flex items-center justify-center text-sm">
                    {getInitials(employee.fullName)}
                  </div>
                  {index < 3 && (
                    <div className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Employee Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{employee.fullName}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs gap-1 ${getStatusColor(employee.status)}`}
                    >
                      {getStatusIcon(employee.status)}
                      {employee.status === 'working' ? 'กำลังทำงาน' : 'ออฟไลน์'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>รหัส: {employee.employeeId}</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {employee.branches.length} สาขา
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {employee.totalSessions} ครั้ง
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      เช็คอิน: {formatLastCheckIn(employee.lastCheckIn)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hours and Progress */}
              <div className="text-right min-w-0">
                <div className="font-semibold text-lg">
                  {formatHours(employee.totalHours)}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  เฉลี่ย: {formatHours(employee.averageHoursPerSession)}/ครั้ง
                </div>
                
                {/* Progress bar for hours relative to max */}
                <div className="w-24">
                  <Progress 
                    value={Math.min((employee.totalHours / Math.max(...data.employees.map(e => e.totalHours))) * 100, 100)}
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          ))}

          {data.employees.length > 10 && (
            <div className="text-center pt-4 border-t">
              <Button 
                variant="ghost" 
                onClick={onViewDetails}
                className="gap-2"
              >
                ดูพนักงานทั้งหมด ({data.employees.length} คน)
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}