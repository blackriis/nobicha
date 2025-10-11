'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout' 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
 Users, 
 Building2, 
 Package, 
 Banknote, 
 TrendingUp, 
 AlertCircle,
 CheckCircle2,
 ArrowRight,
 Activity,
 CalendarDays,
 Eye,
 Loader2
} from 'lucide-react'
import Link from 'next/link'
import { adminReportsService, type ReportSummary } from '@/lib/services/admin-reports.service'

// Types
type QuickActionType = 'branches' | 'employees' | 'materials' | 'payroll'
type ActivityStatus = 'success' | 'warning' | 'error'

interface QuickActionConfig {
 title: string
 description: string
 icon: any
 href: string
 color: string
 bgColor: string
 type: QuickActionType
}

interface ActivityItem {
 title: string
 value: number
 total: number
 percentage: number
 status: ActivityStatus
}

// Quick Actions Configuration
const QUICK_ACTIONS_CONFIG: QuickActionConfig[] = [
 {
  title: 'จัดการสาขา',
  description: 'เพิ่ม แก้ไข หรือจัดการสาขาทั้งหมด',
  icon: Building2,
  href: '/admin/branches',
  color: 'text-blue-600',
  bgColor: 'bg-blue-50 dark:bg-blue-950',
  type: 'branches'
 },
 {
  title: 'จัดการพนักงาน', 
  description: 'ดูข้อมูลพนักงาน การลา และการทำงาน',
  icon: Users,
  href: '/admin/employees',
  color: 'text-green-600',
  bgColor: 'bg-green-50 dark:bg-green-950',
  type: 'employees'
 },
 {
  title: 'จัดการวัตถุดิบ',
  description: 'เพิ่มวัตถุดิบใหม่ และติดตามการใช้งาน',
  icon: Package,
  href: '/admin/raw-materials',
  color: 'text-orange-600',
  bgColor: 'bg-orange-50 dark:bg-orange-950',
  type: 'materials'
 },
 {
  title: 'จัดการเงินเดือน',
  description: 'คำนวณเงินเดือน โบนัส และการหักเงิน',
  icon: Banknote,
  href: '/admin/payroll',
  color: 'text-purple-600',
  bgColor: 'bg-purple-50 dark:bg-purple-950',
  type: 'payroll'
 }
]

// Custom Hooks
function useAdminStats() {
 const [stats, setStats] = useState<ReportSummary | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
  let isMounted = true
  
  const fetchStats = async () => {
   try {
    setLoading(true)
    setError(null)
    
    const result = await adminReportsService.getSummaryReport({ type: 'today' })
    
    if (!isMounted) return
    
    if (result.success && result.data) {
     setStats(result.data)
    } else {
     setError(result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล')
    }
   } catch (err) {
    if (!isMounted) return
    console.error('Error fetching admin stats:', err)
    setError('เกิดข้อผิดพลาดในการดึงข้อมูล')
   } finally {
    if (isMounted) setLoading(false)
   }
  }

  fetchStats()
  
  return () => {
   isMounted = false
  }
 }, [])

 return { stats, loading, error }
}

// Utility Functions
function createQuickActions(stats: ReportSummary | null) {
 return QUICK_ACTIONS_CONFIG.map(config => ({
  ...config,
  stats: stats ? 
   (config.type === 'branches' ? `${stats.branches.total} สาขา` :
    config.type === 'employees' ? `${stats.employees.total} คน` :
    config.type === 'materials' ? `${stats.materials.totalItems} รายการ` :
    'ระบบเงินเดือน') : '-- รายการ',
  trend: stats ?
   (config.type === 'branches' ? 'ทั้งหมดเปิดทำการ' :
    config.type === 'employees' ? `เช็คอินแล้ว ${stats.employees.checkedInToday} คน` :
    config.type === 'materials' ? `ค่าใช้จ่าย ฿${stats.materials.recentUsageCost.toLocaleString()}` :
    'พร้อมใช้งาน') : 'โหลดข้อมูล...'
 }))
}

function createRecentActivity(stats: ReportSummary | null): ActivityItem[] {
 if (!stats) return []
 
 return [
  {
   title: 'พนักงานเช็คอินวันนี้',
   value: stats.employees.checkedInToday,
   total: stats.employees.total,
   percentage: stats.employees.attendanceRate,
   status: (stats.employees.attendanceRate >= 80 ? 'success' : 
       stats.employees.attendanceRate >= 50 ? 'warning' : 'error')
  },
  {
   title: 'สาขาที่เปิดทำการ',
   value: stats.branches.active,
   total: stats.branches.total,
   percentage: Math.round((stats.branches.active / stats.branches.total) * 100),
   status: 'success'
  },
  {
   title: 'ยอดขายวันนี้',
   value: stats.sales.total,
   total: stats.sales.total,
   percentage: 100,
   status: 'success'
  }
 ]
}

// Sub Components
const LoadingState = () => (
 <div className="flex items-center justify-center min-h-[400px]">
  <div className="flex flex-col items-center space-y-4">
   <Loader2 className="h-8 w-8 animate-spin text-primary" />
   <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
  </div>
 </div>
)

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
 <div className="flex items-center justify-center min-h-[400px]">
  <Card className="w-full max-w-md">
   <CardContent className="pt-6">
    <div className="flex flex-col items-center space-y-4">
     <AlertCircle className="h-12 w-12 text-destructive" />
     <div className="text-center">
      <h3 className="text-lg font-semibold">เกิดข้อผิดพลาด</h3>
      <p className="text-sm text-muted-foreground">{error}</p>
     </div>
     <Button onClick={onRetry}>
      โหลดใหม่
     </Button>
    </div>
   </CardContent>
  </Card>
 </div>
)

const WelcomeSection = () => (
 <div className="mb-8">
  <div className="flex items-center justify-between">
   <div>
    <h2 className="text-3xl font-bold tracking-tight mb-2">
     ภาพรวมระบบ
    </h2>
    <p className="text-muted-foreground">
     สรุปข้อมูลสำคัญและการดำเนินงานของระบบบริหารจัดการพนักงาน
    </p>
   </div>
   <div className="flex items-center space-x-2">
    <Badge variant="outline" className="flex items-center gap-1">
     <Activity className="h-3 w-3" />
     ออนไลน์
    </Badge>
    <Badge variant="secondary">
     วันนี้: {new Date().toLocaleDateString('th-TH')}
    </Badge>
   </div>
  </div>
  <Separator className="mt-4" />
 </div>
)

const StatsOverview = ({ stats }: { stats: ReportSummary }) => {
 const statCards = [
  {
   title: 'พนักงานทั้งหมด',
   value: stats.employees.total.toLocaleString(),
   subtitle: `${stats.employees.checkedInToday} คนเช็คอินวันนี้`,
   icon: Users,
   iconBg: 'bg-blue-50 dark:bg-blue-950',
   iconColor: 'text-blue-600'
  },
  {
   title: 'สาขาทั้งหมด',
   value: stats.branches.total,
   subtitle: `${stats.branches.active} เปิดทำการ`,
   icon: Building2,
   iconBg: 'bg-green-50 dark:bg-green-950',
   iconColor: 'text-green-600'
  },
  {
   title: 'ยอดขายวันนี้',
   value: `฿${stats.sales.total.toLocaleString()}`,
   subtitle: stats.sales.period === 'today' ? 'วันนี้' : stats.sales.period || 'ไม่ระบุ',
   icon: TrendingUp,
   iconBg: 'bg-orange-50 dark:bg-orange-950',
   iconColor: 'text-orange-600'
  },
  {
   title: 'วัตถุดิบทั้งหมด',
   value: stats.materials.totalItems,
   subtitle: `ใช้ไป ฿${stats.materials.recentUsageCost.toLocaleString()}`,
   icon: Package,
   iconBg: 'bg-purple-50 dark:bg-purple-950',
   iconColor: 'text-purple-600'
  }
 ]

 return (
  <section aria-labelledby="stats-heading">
   <h2 id="stats-heading" className="sr-only">สถิติภาพรวมระบบ</h2>
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {statCards.map((card, index) => {
     const IconComponent = card.icon
     return (
      <Card key={index} className="border-0">
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
        <div className={`p-2 ${card.iconBg} rounded-lg`}>
         <IconComponent className={`h-4 w-4 ${card.iconColor}`} />
        </div>
       </CardHeader>
       <CardContent>
        <div className="text-2xl font-bold">{card.value}</div>
        <div className="text-xs text-muted-foreground flex items-center mt-1">
         <div className="flex items-center text-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {card.subtitle}
         </div>
        </div>
       </CardContent>
      </Card>
     )
    })}
   </div>
  </section>
 )
}

const QuickActionsSection = ({ quickActions }: { quickActions: ReturnType<typeof createQuickActions> }) => (
 <div className="lg:col-span-2">
  <div className="flex items-center justify-between mb-6">
   <h3 className="text-xl font-semibold tracking-tight">
    เมนูหลัก
   </h3>
   <Button variant="outline" size="sm" className="gap-2">
    <Eye className="h-4 w-4" />
    ดูทั้งหมด
   </Button>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
   {quickActions.map((action) => {
    const IconComponent = action.icon
    return (
     <Card key={action.href} className="border-0 hover: transition-all duration-200 cursor-pointer group" role="article" aria-labelledby={`action-title-${action.href.split('/').pop()}`}>
      <CardHeader className="pb-3">
       <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${action.bgColor} group-hover:scale-105 transition-transform`} aria-hidden="true">
         <IconComponent className={`h-6 w-6 ${action.color}`} />
        </div>
        <div className="text-right">
         <Badge variant="secondary" className="mb-1">{action.stats}</Badge>
         <div className="text-xs text-muted-foreground">{action.trend}</div>
        </div>
       </div>
       <CardTitle id={`action-title-${action.href.split('/').pop()}`} className="text-lg group-hover:text-primary transition-colors">{action.title}</CardTitle>
       <CardDescription className="text-sm">
        {action.description}
       </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
       <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Link 
         href={action.href} 
         className="flex items-center justify-center gap-2"
         aria-label={`เข้าใช้งาน ${action.title}`}
        >
         เข้าใช้งาน
         <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Link>
       </Button>
      </CardContent>
     </Card>
    )
   })}
  </div>
 </div>
)

const ActivityPanel = ({ recentActivity, stats }: { recentActivity: ActivityItem[]; stats: ReportSummary }) => (
 <aside aria-labelledby="activity-heading" className="space-y-6">
  <div className="flex items-center justify-between">
   <h3 id="activity-heading" className="text-xl font-semibold tracking-tight">
    สถานะปัจจุบัน
   </h3>
   <Badge variant="outline" className="gap-1">
    <CalendarDays className="h-3 w-3" />
    Real-time
   </Badge>
  </div>
  <Card className="border-0" role="region" aria-labelledby="daily-activity">
   <CardHeader className="pb-4">
    <div className="flex items-center gap-2">
     <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
      <Activity className="h-4 w-4 text-blue-600" />
     </div>
     <div>
      <CardTitle id="daily-activity" className="text-lg">กิจกรรมวันนี้</CardTitle>
      <CardDescription className="text-sm">
       ติดตามสถานะการทำงานแบบเรียลไทม์
      </CardDescription>
     </div>
    </div>
   </CardHeader>
   <CardContent className="space-y-4">
    {recentActivity.map((activity, index) => (
     <div key={index} className="space-y-2">
      <div className="flex items-center justify-between">
       <span className="text-sm font-medium">
        {activity.title}
       </span>
       <Badge 
        variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'destructive' : 'secondary'}
        className="text-xs"
       >
        {activity.title === 'ยอดขายวันนี้' ? `฿${activity.value.toLocaleString()}` : `${activity.value}/${activity.total}`}
       </Badge>
      </div>
      <Progress 
       value={activity.percentage} 
       className="h-2"
       aria-label={`${activity.title}: ${activity.percentage}% ความคืบหน้า (${activity.value}/${activity.total})`}
      />
      <div className="text-xs text-muted-foreground">
       {activity.title === 'ยอดขายวันนี้' ? `฿${activity.value.toLocaleString()}` : `${activity.percentage}% ความคืบหน้า`}
      </div>
     </div>
    ))}
   </CardContent>
  </Card>

  <Card className="border-0" role="region" aria-labelledby="quick-stats">
   <CardHeader className="pb-4">
    <div className="flex items-center gap-2">
     <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
      <Activity className="h-4 w-4 text-green-600" />
     </div>
     <CardTitle id="quick-stats" className="text-lg">ข้อมูลด่วน</CardTitle>
    </div>
   </CardHeader>
   <CardContent className="space-y-3">
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
     <span className="text-sm text-muted-foreground">วัตถุดิบทั้งหมด</span>
     <span className="font-semibold">{stats.materials.totalItems} รายการ</span>
    </div>
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
     <span className="text-sm text-muted-foreground">ยอดขายวันนี้</span>
     <span className="font-semibold text-green-600">
      ฿{stats.sales.total.toLocaleString()}
     </span>
    </div>
    <div className="flex items-center justify-between py-2">
     <span className="text-sm text-muted-foreground">ค่าใช้จ่ายวัตถุดิบ</span>
     <span className="font-semibold text-destructive">
      ฿{stats.materials.recentUsageCost.toLocaleString()}
     </span>
    </div>
   </CardContent>
  </Card>
 </aside>
)

const AdminDashboard = memo(function AdminDashboard() {
 const { stats, loading, error } = useAdminStats()
 
 const quickActions = useMemo(() => createQuickActions(stats), [stats])
 const recentActivity = useMemo(() => createRecentActivity(stats), [stats])

 if (loading) {
  return (
   <AdminLayout>
    <LoadingState />
   </AdminLayout>
  )
 }

 if (error) {
  return (
   <AdminLayout>
    <ErrorState error={error} onRetry={() => window.location.reload()} />
   </AdminLayout>
  )
 }

 if (!stats) {
  return (
   <AdminLayout>
    <ErrorState error="ไม่พบข้อมูลสถิติ" onRetry={() => window.location.reload()} />
   </AdminLayout>
  )
 }

 return (
  <AdminLayout data-testid="admin-dashboard">
   <WelcomeSection />
   <StatsOverview stats={stats} />
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <QuickActionsSection quickActions={quickActions} />
    <ActivityPanel recentActivity={recentActivity} stats={stats} />
   </div>
  </AdminLayout>
 )
})

AdminDashboard.displayName = 'AdminDashboard'

export default AdminDashboard