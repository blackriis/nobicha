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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">ไม่มีข้อมูลสรุป</p>
          </CardContent>
        </Card>
      </div>
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
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
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
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
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
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
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      progress: Math.min((summary.materials.recentUsageCost / 100000) * 100, 100), // Cap at 100%
      progressLabel: 'งบประมาณ 100K',
      trend: summary.materials.recentUsageCost < 50000 ? 'up' : 'down',
      badge: summary.materials.recentUsageCost < 50000 ? 'ประหยัด' : 'ใช้งานสูง'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryCards.map((card) => {
        const Icon = card.icon
        const TrendIcon = card.trend === 'up' ? ArrowUpRight : 
                         card.trend === 'down' ? ArrowDownRight : Activity

        return (
          <Card 
            key={card.id} 
            className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => onCardClick?.(card.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor} group-hover:scale-105 transition-transform`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Main Value */}
                <div>
                  <div className="text-2xl font-bold group-hover:text-primary transition-colors">
                    {card.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {card.subtitle}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {card.progressLabel}
                    </span>
                    <span className="text-xs font-medium">
                      {Math.round(card.progress)}%
                    </span>
                  </div>
                  <Progress 
                    value={card.progress} 
                    className="h-2"
                  />
                </div>

                {/* Status Badge and Trend */}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={card.trend === 'up' ? 'default' : card.trend === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {card.badge}
                  </Badge>
                  
                  <div className={`flex items-center gap-1 text-xs ${
                    card.trend === 'up' ? 'text-green-600' : 
                    card.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    <TrendIcon className="h-3 w-3" />
                    <span className="font-medium">
                      {card.trend === 'up' ? 'ดี' : card.trend === 'down' ? 'ต้องปรับปรุง' : 'ปกติ'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}