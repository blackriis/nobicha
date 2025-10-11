'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
 Users, 
 Building2, 
 TrendingUp, 
 Package,
 CheckCircle2,
 AlertCircle,
 ArrowUpRight,
 ArrowDownRight,
 Activity,
 DollarSign
} from 'lucide-react'
import type { ReportSummary } from '@/lib/services/admin-reports.service'

interface ReportsSummaryCardsProps {
 summary: ReportSummary | null
 isLoading?: boolean
 onCardClick?: (section: string) => void
}

export function ReportsSummaryCards({ 
 summary, 
 isLoading = false,
 onCardClick 
}: ReportsSummaryCardsProps) {
 
 if (isLoading) {
  return (
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, index) => (
     <Card key={`skeleton-${index}`} className="border border-border bg-background rounded-lg transition-all dark:border-muted dark:bg-muted/30">
      <CardHeader className="pb-3">
       <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-3/4 dark:bg-muted/50"></div>
        <div className="h-8 bg-muted rounded w-1/2 dark:bg-muted/50"></div>
       </div>
      </CardHeader>
      <CardContent>
       <div className="animate-pulse space-y-4">
        <div className="h-3 bg-muted rounded w-full mb-2 dark:bg-muted/50"></div>
        <div className="h-2 bg-muted rounded w-2/3 dark:bg-muted/50"></div>
        <div className="h-8 bg-muted rounded w-full dark:bg-muted/50"></div>
       </div>
      </CardContent>
     </Card>
    ))}
   </div>
  )
 }

 if (!summary) {
  return (
   <Card className="border border-border bg-background rounded-lg transition-all col-span-full dark:border-muted dark:bg-muted/30">
    <CardContent className="p-12 text-center">
     <div className="flex flex-col items-center space-y-4">
      <div className="p-3 bg-muted rounded-lg dark:bg-muted/30">
       <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
       <p className="text-sm font-medium text-foreground">ไม่มีข้อมูลสรุป</p>
       <p className="text-xs text-muted-foreground mt-1">ลองรีเฟรชข้อมูลหรือตรวจสอบการเชื่อมต่อ</p>
      </div>
     </div>
    </CardContent>
   </Card>
  )
 }

 const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
   style: 'currency',
   currency: 'THB',
   minimumFractionDigits: 0,
   maximumFractionDigits: 0
  }).format(amount)
 }

 const summaryCards = [
  {
   id: 'employees',
   title: 'พนักงานทั้งหมด',
   value: summary.employees.total.toLocaleString(),
   subtitle: `${summary.employees.checkedInToday} คนเช็คอินวันนี้`,
   icon: Users,
   color: 'text-primary',
   bgColor: 'bg-primary/10',
   progress: summary.employees.attendanceRate,
   progressLabel: `${summary.employees.attendanceRate}% เข้างาน`,
   trend: summary.employees.checkedInToday > 0 ? 'up' : 'neutral',
   badge: summary.employees.checkedInToday > 0 ? 'กำลังทำงาน' : 'ออฟไลน์'
  },
  {
   id: 'branches',
   title: 'สาขาทั้งหมด',
   value: summary.branches.total.toLocaleString(),
   subtitle: `${summary.branches.active} สาขาเปิดทำการ`,
   icon: Building2,
   color: 'text-primary',
   bgColor: 'bg-primary/10',
   progress: summary.branches.total > 0 ? (summary.branches.active / summary.branches.total) * 100 : 0,
   progressLabel: 'เปิดทำการ',
   trend: 'up',
   badge: 'ทำงานปกติ'
  },
  {
   id: 'sales',
   title: `ยอดขาย${summary.sales.period === 'today' ? 'วันนี้' : summary.sales.period === 'week' ? 'สัปดาห์นี้' : 'เดือนนี้'}`,
   value: formatCurrency(summary.sales.total),
   subtitle: `ช่วงเวลา: ${summary.sales.period}`,
   icon: TrendingUp,
   color: 'text-primary',
   bgColor: 'bg-primary/10',
   progress: Math.min((summary.sales.total / 1000000) * 100, 100), // Cap at 100%
   progressLabel: 'เป้าหมาย 1M',
   trend: summary.sales.total > 0 ? 'up' : 'neutral',
   badge: summary.sales.total > 500000 ? 'เป้าหมายดี' : 'ปานกลาง'
  },
  {
   id: 'materials',
   title: 'วัตถุดิบทั้งหมด',
   value: summary.materials.totalItems.toLocaleString(),
   subtitle: `ค่าใช้จ่าย: ${formatCurrency(summary.materials.recentUsageCost)}`,
   icon: Package,
   color: 'text-primary',
   bgColor: 'bg-primary/10',
   progress: Math.min((summary.materials.recentUsageCost / 100000) * 100, 100), // Cap at 100%
   progressLabel: 'งบประมาณ 100K',
   trend: summary.materials.recentUsageCost < 50000 ? 'up' : 'down',
   badge: summary.materials.recentUsageCost < 50000 ? 'ประหยัด' : 'ใช้งานสูง'
  }
 ]

 return (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
   {summaryCards.map((card, index) => {
    const Icon = card.icon
    const TrendIcon = card.trend === 'up' ? ArrowUpRight :
             card.trend === 'down' ? ArrowDownRight : Activity

    return (
     <Card
      key={card.id}
      className="border border-border bg-background rounded-lg transition-all hover: cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-muted dark:bg-muted/30"
      onClick={() => onCardClick?.(card.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
       if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onCardClick?.(card.id)
       }
      }}
      aria-label={`View ${card.title} details`}
     >


      {/* Card Header */}
      <CardHeader className="pb-3">
       <div className="flex items-center justify-between">
        <div>
         <CardTitle className="text-sm font-medium text-foreground">
          {card.title}
         </CardTitle>
        </div>
        <div className={`p-2 rounded-lg ${card.bgColor}`}>
         <Icon className={`h-4 w-4 ${card.color}`} />
        </div>
       </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="space-y-4 pt-2">
       {/* Main Value */}
       <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground">
         {card.value}
        </div>
        <div className="text-xs text-muted-foreground">
         {card.subtitle}
        </div>
       </div>

       {/* Progress Bar */}
       <div className="space-y-2">
        <div className="flex items-center justify-between">
         <span className="text-xs font-medium text-muted-foreground">
          {card.progressLabel}
         </span>
         <span className="text-xs font-bold text-foreground">
          {Math.round(card.progress)}%
         </span>
        </div>
        <Progress 
         value={card.progress} 
         className="h-2 bg-muted"
         indicatorClassName="bg-primary"
        />
       </div>

       {/* Status Badge and Trend */}
       <div className="flex items-center justify-between pt-2">
        <Badge
         variant={card.trend === 'up' ? 'default' : card.trend === 'down' ? 'destructive' : 'secondary'}
         className="text-xs px-2 py-1"
        >
         {card.badge}
        </Badge>

        <div className={`flex items-center gap-1 text-xs ${
         card.trend === 'up' ? 'text-green-600 dark:text-green-400' :
         card.trend === 'down' ? 'text-red-600 dark:text-red-400' :
         'text-muted-foreground'
        }`}>
         <TrendIcon className="h-3 w-3" />
         <span>
          {card.trend === 'up' ? 'ดีเยี่ยม' : card.trend === 'down' ? 'ต้องปรับปรุง' : 'ปกติ'}
         </span>
        </div>
       </div>
      </CardContent>
     </Card>
    )
   })}
  </div>
 )
}