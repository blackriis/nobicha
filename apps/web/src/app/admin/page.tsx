'use client'

import { useMemo } from 'react'
import { useAuth } from '@/components/auth'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
 Eye,
 Loader2,
 RefreshCw,
 BarChart3,
 Clock,
 DollarSign,
 ArrowUpRight,
 ArrowDownRight,
 Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useAdminStats } from '@/hooks/useAdminStats'
import type { ReportSummary } from '@/lib/services/admin-reports.service'

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
    percentage: stats.sales.total > 0 ? 100 : 0,
    status: stats.sales.total > 0 ? 'success' : 'warning'
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

const WelcomeSection = ({ onRefresh, isLoading }: { onRefresh: () => void; isLoading: boolean }) => (
 <div className="mb-6 sm:mb-8">
  <div className="flex items-center justify-between gap-2 sm:gap-4">
   {/* Left Section */}
   <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
    <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg flex-shrink-0">
     <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary-foreground" />
    </div>
    <div className="min-w-0">
     <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight truncate">
      ภาพรวมระบบ
     </h1>
     <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate hidden sm:block">
      ข้อมูลสรุปและสถิติล่าสุด
     </p>
    </div>
   </div>

   {/* Right Section */}
   <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
    <Badge variant="outline" className="gap-1 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm hidden xs:flex">
     <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
     <span className="hidden sm:inline">{new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
     })}</span>
     <span className="sm:hidden">{new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short'
     })}</span>
    </Badge>
    <Button
     variant="outline"
     size="sm"
     onClick={onRefresh}
     disabled={isLoading}
     className="gap-1.5 sm:gap-2 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
    >
     <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
     <span className="text-[10px] sm:text-xs md:text-sm">อัปเดต</span>
    </Button>
   </div>
  </div>
 </div>
)

const StatsOverview = ({ stats }: { stats: ReportSummary }) => {
 const statCards = [
  {
   title: 'พนักงานทั้งหมด',
   value: stats.employees.total.toLocaleString(),
   subtitle: `${stats.employees.checkedInToday} คนเช็คอินวันนี้`,
   trend: '+12%',
   trendUp: true,
   icon: Users,
   gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
   iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
   iconColor: 'text-white'
  },
  {
   title: 'สาขาทั้งหมด',
   value: stats.branches.total,
   subtitle: `${stats.branches.active} เปิดทำการ`,
   trend: '100%',
   trendUp: true,
   icon: Building2,
   gradient: 'from-green-500/10 via-green-500/5 to-transparent',
   iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
   iconColor: 'text-white'
  },
  {
   title: 'ยอดขายวันนี้',
   value: `฿${stats.sales.total.toLocaleString()}`,
   subtitle: stats.sales.period === 'today' ? 'วันนี้' : stats.sales.period || 'ไม่ระบุ',
   trend: stats.sales.total > 0 ? '+5%' : '0%',
   trendUp: stats.sales.total > 0,
   icon: DollarSign,
   gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
   iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
   iconColor: 'text-white'
  },
  {
   title: 'วัตถุดิบ',
   value: `฿${stats.materials.recentUsageCost.toLocaleString()}`,
   subtitle: `ทั้งหมด ${stats.materials.totalItems} รายการ`,
   trend: '-3%',
   trendUp: false,
   icon: Package,
   gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
   iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
   iconColor: 'text-white'
  }
 ]

 return (
  <section aria-labelledby="stats-heading" className="mb-8 sm:mb-10">
   <h2 id="stats-heading" className="sr-only">สถิติภาพรวมระบบ</h2>
   <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
    {statCards.map((card, index) => {
     const IconComponent = card.icon
     const TrendIcon = card.trendUp ? ArrowUpRight : ArrowDownRight
     return (
      <Card
       key={index}
       className={`relative overflow-hidden border-0 bg-gradient-to-br ${card.gradient} hover:shadow-xl transition-all duration-300 group hover:-translate-y-1`}
      >
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
         {card.title}
        </CardTitle>
        <div className={`p-2.5 sm:p-3 ${card.iconBg} rounded-xl shadow-lg flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
         <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
        </div>
       </CardHeader>
       <CardContent className="space-y-2">
        <div className="text-3xl sm:text-4xl font-bold tracking-tight">
         {card.value}
        </div>
        <div className="flex items-center justify-between gap-2">
         <p className="text-xs sm:text-sm text-muted-foreground truncate flex-1">
          {card.subtitle}
         </p>
         <Badge
          variant={card.trendUp ? "default" : "secondary"}
          className="gap-1 text-xs font-semibold flex-shrink-0"
         >
          <TrendIcon className="h-3 w-3" />
          {card.trend}
         </Badge>
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
  <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
   <div className="min-w-0 flex-1">
    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight truncate">
     เมนูการจัดการ
    </h3>
    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate hidden sm:block">
     เลือกระบบที่ต้องการจัดการ
    </p>
   </div>
   <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 flex-shrink-0 h-8 sm:h-9">
    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    <span className="text-xs sm:text-sm">ดูทั้งหมด</span>
   </Button>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
   {quickActions.map((action) => {
    const IconComponent = action.icon
    return (
     <Link key={action.href} href={action.href}>
      <Card
       className="relative overflow-hidden border hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer group bg-card/50 backdrop-blur-sm hover:-translate-y-1"
       role="article"
       aria-labelledby={`action-title-${action.href.split('/').pop()}`}
      >
       {/* Gradient Background on Hover */}
       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

       <CardHeader className="relative pb-4">
        <div className="flex items-start gap-4">
         <div className={`p-3 rounded-xl ${action.bgColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0 shadow-md`}>
          <IconComponent className={`h-6 w-6 ${action.color}`} />
         </div>
         <div className="min-w-0 flex-1">
          <CardTitle
           id={`action-title-${action.href.split('/').pop()}`}
           className="text-base sm:text-lg group-hover:text-primary transition-colors mb-1"
          >
           {action.title}
          </CardTitle>
          <CardDescription className="text-sm line-clamp-2">
           {action.description}
          </CardDescription>
         </div>
        </div>
       </CardHeader>

       <CardContent className="relative pt-0">
        <div className="flex items-center justify-between">
         <div className="space-y-1">
          <Badge variant="secondary" className="text-sm font-semibold">
           {action.stats}
          </Badge>
          <p className="text-xs text-muted-foreground">
           {action.trend}
          </p>
         </div>
         <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-300 flex-shrink-0" />
        </div>
       </CardContent>
      </Card>
     </Link>
    )
   })}
  </div>
 </div>
)

const ActivityPanel = ({ recentActivity, stats }: { recentActivity: ActivityItem[]; stats: ReportSummary }) => (
 <aside aria-labelledby="activity-heading" className="space-y-4 sm:space-y-5 md:space-y-6">
  <div className="flex items-center justify-between gap-2 sm:gap-3">
   <div className="min-w-0 flex-1">
    <h3 id="activity-heading" className="text-base sm:text-lg md:text-xl font-bold tracking-tight truncate">
     สถานะปัจจุบัน
    </h3>
    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate hidden sm:block">
     ข้อมูล ณ วันที่โหลด
    </p>
   </div>
   <Badge variant="outline" className="gap-1 sm:gap-1.5 text-xs sm:text-sm flex-shrink-0 px-2 sm:px-3 h-7 sm:h-8">
    <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
    <span className="hidden sm:inline">Dashboard</span>
   </Badge>
  </div>
  
  {/* Activity Card */}
  <Card className="border-0 bg-gradient-to-br from-blue-500/5 via-background to-background" role="region" aria-labelledby="daily-activity">
   <CardHeader className="pb-3 sm:pb-4">
    <div className="flex items-center gap-2">
     <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex-shrink-0">
      <Activity className="h-4 w-4 text-white" />
     </div>
     <div className="min-w-0 flex-1">
      <CardTitle id="daily-activity" className="text-sm sm:text-base lg:text-lg">
       กิจกรรมวันนี้
      </CardTitle>
      <CardDescription className="text-xs sm:text-sm">
       ติดตามสถานะการทำงาน
      </CardDescription>
     </div>
    </div>
   </CardHeader>
   <CardContent className="space-y-4">
    {recentActivity.map((activity, index) => (
     <div key={index} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
       <span className="text-xs sm:text-sm font-medium truncate">
        {activity.title}
       </span>
       <Badge 
        variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'destructive' : 'secondary'}
        className="text-[10px] sm:text-xs flex-shrink-0 font-semibold"
       >
        {activity.title === 'ยอดขายวันนี้' ? `฿${activity.value.toLocaleString()}` : `${activity.value}/${activity.total}`}
       </Badge>
      </div>
      {activity.title === 'ยอดขายวันนี้' && activity.value === 0 ? (
       <div className="text-[10px] sm:text-xs text-muted-foreground italic flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        ยังไม่มียอดขายในวันนี้
       </div>
      ) : (
       <>
        <div className="relative">
         <Progress 
          value={activity.percentage} 
          className="h-2"
          aria-label={`${activity.title}: ${activity.percentage}% ความคืบหน้า (${activity.value}/${activity.total})`}
         />
        </div>
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
         <span>
          {activity.title === 'ยอดขายวันนี้' ? `฿${activity.value.toLocaleString()}` : `${activity.percentage}% ความคืบหน้า`}
         </span>
         {activity.status === 'success' && (
          <span className="flex items-center gap-1 text-green-600">
           <CheckCircle2 className="h-3 w-3" />
           ดีมาก
          </span>
         )}
        </div>
       </>
      )}
     </div>
    ))}
   </CardContent>
  </Card>

  {/* Quick Stats Card */}
  <Card className="border-0 bg-gradient-to-br from-green-500/5 via-background to-background" role="region" aria-labelledby="quick-stats">
   <CardHeader className="pb-3 sm:pb-4">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-2">
      <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex-shrink-0">
       <BarChart3 className="h-4 w-4 text-white" />
      </div>
      <CardTitle id="quick-stats" className="text-sm sm:text-base lg:text-lg">
       สรุปยอดรวม
      </CardTitle>
     </div>
    </div>
   </CardHeader>
   <CardContent className="space-y-3">
    <div className="flex items-center justify-between py-2 border-b border-border/50">
     <div className="flex items-center gap-2">
      <Package className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs sm:text-sm text-muted-foreground">วัตถุดิบทั้งหมด</span>
     </div>
     <span className="text-xs sm:text-sm font-bold">{stats.materials.totalItems} รายการ</span>
    </div>
    <div className="flex items-center justify-between py-2 border-b border-border/50">
     <div className="flex items-center gap-2">
      <TrendingUp className="h-4 w-4 text-green-600" />
      <span className="text-xs sm:text-sm text-muted-foreground">ยอดขายวันนี้</span>
     </div>
     <span className="text-xs sm:text-sm font-bold text-green-600">
      ฿{stats.sales.total.toLocaleString()}
     </span>
    </div>
    <div className="flex items-center justify-between py-2">
     <div className="flex items-center gap-2">
      <DollarSign className="h-4 w-4 text-destructive" />
      <span className="text-xs sm:text-sm text-muted-foreground">ค่าใช้จ่ายวัตถุดิบ</span>
     </div>
     <span className="text-xs sm:text-sm font-bold text-destructive">
      ฿{stats.materials.recentUsageCost.toLocaleString()}
     </span>
    </div>
   </CardContent>
  </Card>
 </aside>
)

function AdminDashboard() {
 const { user, isAdmin } = useAuth()
 const isAuthenticated = !!(user && isAdmin)
 const { stats, loading, error, refresh } = useAdminStats()

 // useMemo hooks must be called before any early returns
 const quickActions = useMemo(() => createQuickActions(stats), [stats])
 const recentActivity = useMemo(() => createRecentActivity(stats), [stats])

 // Check if user is authenticated and has admin role
 if (!isAuthenticated) {
   return (
     <AdminLayout>
       <div className="flex flex-col items-center justify-center min-h-[400px]">
         <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
         <h2 className="text-xl font-semibold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
         <p className="text-gray-600 text-center">
           คุณต้องเป็นผู้ดูแลระบบจึงจะเข้าถึงหน้านี้ได้
         </p>
       </div>
     </AdminLayout>
   )
 }

 if (loading && !stats) {
  return (
   <AdminLayout>
    <LoadingState />
   </AdminLayout>
  )
 }

 if (error && !stats) {
  return (
   <AdminLayout>
    <ErrorState error={error} onRetry={refresh} />
   </AdminLayout>
  )
 }

 if (!stats) {
  return (
   <AdminLayout>
    <ErrorState error="ไม่พบข้อมูลสถิติ" onRetry={refresh} />
   </AdminLayout>
  )
 }

 return (
  <AdminLayout data-testid="admin-dashboard">
   <WelcomeSection onRefresh={refresh} isLoading={loading} />
   <StatsOverview stats={stats} />
   <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
    <QuickActionsSection quickActions={quickActions} />
    <ActivityPanel recentActivity={recentActivity} stats={stats} />
   </div>
  </AdminLayout>
 )
}

export default AdminDashboard