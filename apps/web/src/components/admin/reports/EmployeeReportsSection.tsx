'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import type { DateRangeFilter } from '@/lib/services/admin-reports.service'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

interface EmployeeSummary {
 totalEmployees: number
 totalHours: number
 activeEmployees: number
 averageHoursPerEmployee: number
}

interface EmployeeReportsSectionProps {
 data: {
  summary: EmployeeSummary
  employees: EmployeeReport[]
  dateRange: DateRangeFilter
 } | null
 isLoading?: boolean
 onViewDetails?: () => void
}

const STATUS_STYLES: Record<string, { colorClass: string; icon: JSX.Element }> = {
 working: {
  colorClass: 'bg-accent/10 text-accent-foreground border border-accent/30',
  icon: <UserCheck className="h-3 w-3 text-accent-foreground" />
 },
 offline: {
  colorClass: 'bg-muted text-muted-foreground border border-border dark:bg-muted/30 dark:text-muted/80',
  icon: <UserX className="h-3 w-3 text-muted-foreground dark:text-muted/80" />
 },
 default: {
  colorClass: 'bg-accent/10 text-accent-foreground border border-accent/30',
  icon: <Activity className="h-3 w-3 text-accent-foreground" />
 }
}

export function EmployeeReportsSection({ 
 data, 
 isLoading = false,
 onViewDetails 
}: EmployeeReportsSectionProps) {
 // Calculate maxHours before any early returns (React Hook rules)
 const maxHours = useMemo(() => {
  if (!data) return 0
  return Math.max(...data.employees.map(e => e.totalHours))
 }, [data])
 
 if (isLoading) {
  return (
   <Card className="border border-border bg-background transition-colors duration-300">
    <CardHeader>
     <div className="animate-pulse transition-colors duration-300">
      <div className="h-6 bg-muted rounded w-1/3 mb-2 dark:bg-muted/30"></div>
      <div className="h-4 bg-muted rounded w-1/2 dark:bg-muted/30"></div>
     </div>
    </CardHeader>
    <CardContent>
     <div className="space-y-4 transition-colors duration-300">
      {Array.from({ length: 5 }).map((_, index) => (
       <div key={index} className="animate-pulse flex items-center space-x-4 transition-colors duration-300">
        <div className="h-10 w-10 bg-muted rounded-full dark:bg-muted/30"></div>
        <div className="flex-1 space-y-2">
         <div className="h-4 bg-muted rounded w-3/4 dark:bg-muted/30"></div>
         <div className="h-3 bg-muted rounded w-1/2 dark:bg-muted/30"></div>
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
   <Card className="border border-border bg-background transition-colors duration-300">
    <CardHeader>
     <div className="flex items-center gap-2 transition-colors duration-300">
      <Users className="h-5 w-5 text-accent-foreground" />
      <div>
       <CardTitle className="text-lg text-foreground">รายงานพนักงาน</CardTitle>
       <p className="text-sm text-muted-foreground">
        ไม่มีข้อมูลในช่วงนี้ — ลองเลือกช่วงเวลาอื่นดูไหม?
       </p>
      </div>
     </div>
    </CardHeader>
    <CardContent>
     <div className="text-center py-8 transition-colors duration-300">
      <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3 dark:text-muted/70" />
      <p className="text-muted-foreground dark:text-muted/80">ไม่มีข้อมูลพนักงานในช่วงเวลานี้</p>
      {process.env.NODE_ENV === 'development' && (
       <div className="mt-4 p-3 bg-muted rounded text-xs text-left text-muted-foreground dark:bg-muted/30 dark:text-muted/80">
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
  const isToday = date.toDateString() === now.toDateString()
  
  if (isToday) {
   return format(date, 'HH:mm น.', { locale: th })
  } else {
   return format(date, 'dd/MM/yyyy HH:mm น.', { locale: th })
  }
 }

 const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
 }

 const getStatusColor = (status: string) => {
  return STATUS_STYLES[status]?.colorClass ?? STATUS_STYLES.default.colorClass
 }

 const getStatusIcon = (status: string) => {
  return STATUS_STYLES[status]?.icon ?? STATUS_STYLES.default.icon
 }

 const topEmployees = data.employees.slice(0, 10) // Show top 10 employees

 return (
  <Card className="border border-border bg-background transition-colors duration-300">
   <CardHeader>
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 transition-colors duration-300">
     <div className="flex items-center gap-2 transition-colors duration-300">
      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground flex-shrink-0" />
      <div>
       <CardTitle className="text-base sm:text-lg text-foreground">รายงานพนักงาน</CardTitle>
       <p className="text-xs sm:text-sm text-muted-foreground">
        ข้อมูลการทำงานและเวลาของพนักงาน (เรียงตามเช็คอินล่าสุด)
       </p>
      </div>
     </div>
     
     <Button 
      variant="outline" 
      size="sm" 
      onClick={onViewDetails}
      aria-label="ดูรายละเอียดรายงานพนักงาน"
      className="gap-2 hover:bg-accent focus-visible:ring-ring transition-colors duration-300 w-full sm:w-auto text-xs sm:text-sm"
     >
      ดูรายละเอียด
      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
     </Button>
    </div>

    {/* Summary Stats */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 transition-colors duration-300">
     <div className="p-2 sm:p-3 bg-accent/10 rounded-lg border border-accent/30 dark:bg-accent/20">
      <div className="flex items-center gap-1.5 sm:gap-2">
       <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-foreground flex-shrink-0" />
       <span className="text-xs sm:text-sm font-medium text-accent-foreground truncate">พนักงานทั้งหมด</span>
      </div>
      <div className="text-lg sm:text-xl font-bold text-accent-foreground mt-1">
       {data.summary.totalEmployees}
      </div>
     </div>
     
     <div className="p-2 sm:p-3 bg-accent/10 rounded-lg border border-accent/30 dark:bg-accent/20 transition-colors duration-300">
      <div className="flex items-center gap-1.5 sm:gap-2">
       <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-foreground flex-shrink-0" />
       <span className="text-xs sm:text-sm font-medium text-accent-foreground truncate">ชั่วโมงรวม</span>
      </div>
      <div className="text-lg sm:text-xl font-bold text-accent-foreground mt-1">
       {Math.round(data.summary.totalHours)}
      </div>
     </div>
     
     <div className="p-2 sm:p-3 bg-accent/10 rounded-lg border border-accent/30 dark:bg-accent/20 transition-colors duration-300">
      <div className="flex items-center gap-1.5 sm:gap-2">
       <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-foreground flex-shrink-0" />
       <span className="text-xs sm:text-sm font-medium text-accent-foreground truncate">กำลังทำงาน</span>
      </div>
      <div className="text-lg sm:text-xl font-bold text-accent-foreground mt-1">
       {data.summary.activeEmployees}
      </div>
     </div>
     
     <div className="p-2 sm:p-3 bg-accent/10 rounded-lg border border-accent/30 dark:bg-accent/20 transition-colors duration-300">
      <div className="flex items-center gap-1.5 sm:gap-2">
       <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-foreground flex-shrink-0" />
       <span className="text-xs sm:text-sm font-medium text-accent-foreground truncate">เฉลี่ย/คน</span>
      </div>
      <div className="text-lg sm:text-xl font-bold text-accent-foreground mt-1">
       {Math.round(data.summary.averageHoursPerEmployee)}
      </div>
     </div>
    </div>
   </CardHeader>

   <CardContent>
    <div className="space-y-3 sm:space-y-4 transition-colors duration-300">
     {topEmployees.map((employee, index) => (
      <div 
       key={employee.userId}
       className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border border-border hover:bg-muted dark:hover:bg-muted/30 transition-colors duration-300 gap-3 sm:gap-0"
      >
       <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto transition-colors duration-300">
        {/* Avatar with Ranking */}
        <div className="relative flex-shrink-0">
         <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-border transition-colors duration-300">
          <AvatarImage src={employee.avatarUrl || ''} alt={employee.fullName} className="object-cover" />
          <AvatarFallback className="bg-muted text-foreground text-xs font-medium">{getInitials(employee.fullName)}</AvatarFallback>
         </Avatar>
         {index < 3 && (
          <div className={`absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full text-[10px] sm:text-xs font-bold flex items-center justify-center text-white ${
           index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
          } transition-colors duration-300`}>
           {index + 1}
          </div>
         )}
        </div>

        {/* Employee Info */}
        <div className="flex-1 min-w-0 transition-colors duration-300">
         <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <p className="font-medium truncate text-sm sm:text-base text-foreground">{employee.fullName}</p>
          <Badge 
           variant="outline" 
           className={`text-[10px] sm:text-xs gap-1 transition-colors duration-300 w-fit ${getStatusColor(employee.status)}`}
          >
           {getStatusIcon(employee.status)}
           {employee.status === 'working' ? 'กำลังทำงาน' : 'ออฟไลน์'}
          </Badge>
         </div>
         
         <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-1.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground dark:text-muted/80 transition-colors duration-300">
          <span className="hidden sm:inline">รหัส: {employee.employeeId}</span>
          <span className="flex items-center gap-1">
           <Building2 className="h-3 w-3 flex-shrink-0" />
           <span className="truncate">{employee.branches.length} สาขา</span>
          </span>
          <span className="flex items-center gap-1">
           <Timer className="h-3 w-3 flex-shrink-0" />
           <span className="truncate">{employee.totalSessions} ครั้ง</span>
          </span>
          <span className="flex items-center gap-1 min-w-0">
           <Clock className="h-3 w-3 flex-shrink-0" />
           <span className="truncate">เช็คอิน: {formatLastCheckIn(employee.lastCheckIn)}</span>
          </span>
         </div>
        </div>
       </div>

       {/* Hours and Progress */}
       <div className="text-left sm:text-right min-w-0 w-full sm:w-auto transition-colors duration-300 flex sm:block items-center sm:items-end justify-between sm:justify-end gap-3">
        <div className="flex-1 sm:flex-none">
         <div className="font-semibold text-base sm:text-lg text-foreground">
          {formatHours(employee.totalHours)}
         </div>
         <div className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 dark:text-muted/80">
          เฉลี่ย: {formatHours(employee.averageHoursPerSession)}/ครั้ง
         </div>
        </div>
        
        {/* Progress bar for hours relative to max */}
        <div className="w-20 sm:w-24 flex-shrink-0">
         <Progress 
          value={maxHours > 0 ? Math.min((employee.totalHours / maxHours) * 100, 100) : 0}
          className="h-1.5 sm:h-2"
          aria-label={`ความคืบหน้าชั่วโมงทำงานของ ${employee.fullName}`}
         />
        </div>
       </div>
      </div>
     ))}

     {data.employees.length > 10 && (
      <div className="text-center pt-3 sm:pt-4 border-t border-border transition-colors duration-300">
       <Button 
        variant="ghost" 
        onClick={onViewDetails}
        aria-label="ดูพนักงานทั้งหมด"
        className="gap-2 hover:bg-accent focus-visible:ring-ring transition-colors duration-300 text-sm sm:text-base"
       >
        ดูพนักงานทั้งหมด ({data.employees.length} คน)
        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
       </Button>
      </div>
     )}
    </div>
   </CardContent>
  </Card>
 )
}