'use client'

import { useAuth, LogoutButton } from '@/components/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Package, BarChart, History } from 'lucide-react'
import { useMemo, useCallback } from 'react'
import ThemeSwitcher from '@/components/ui/theme-switcher'

// Extract navigation items outside component to avoid unnecessary recalculations
const navigationItems = [
 {
  name: 'หน้าหลัก',
  href: '/dashboard',
  icon: Home,
  ariaLabel: 'ไปยังหน้าหลัก'
 },
 {
  name: 'รายงานการใช้วัตถุดิบ',
  href: '/dashboard/material-usage',
  icon: Package,
  ariaLabel: 'ไปยังรายงานการใช้วัตถุดิบ'
 },
 {
  name: 'รายงานยอดขาย',
  href: '/dashboard/daily-sales',
  icon: BarChart,
  ariaLabel: 'ไปยังรายงานยอดขาย'
 },
 {
  name: 'ประวัติการทำงาน',
  href: '/dashboard/work-history',
  icon: History,
  ariaLabel: 'ไปยังประวัติการทำงาน'
 }
] as const

interface UserInfoProps {
 fullName?: string
 branchName?: string
}

// Memoized user info section to prevent unnecessary re-renders
const UserInfo = ({ fullName, branchName }: UserInfoProps) => (
 <div className="flex-1 min-w-0">
  <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
   แดชบอร์ดพนักงาน
  </h1>
  {fullName && (
   <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
    ยินดีต้อนรับ, {fullName}
   </p>
  )}
 </div>
)

// Memoized user actions section
const UserActions = ({ branchName }: { branchName?: string }) => (
 <div className="flex items-center space-x-2 sm:space-x-4 ml-2">
  {branchName && (
   <div className="hidden sm:block text-xs text-gray-600 dark:text-gray-400" aria-label="สาขาปัจจุบัน">
    สาขา: {branchName}
   </div>
  )}
  <ThemeSwitcher />
  <LogoutButton variant="outline" size="sm" />
 </div>
)

export function EmployeeDashboardHeader() {
 const { user } = useAuth()
 const pathname = usePathname()
 const router = useRouter()

 // Memoize navigation handler to prevent unnecessary re-renders
 const handleNavigation = useCallback((value: string) => {
  router.push(value)
 }, [router])

 // Memoize user data to prevent unnecessary re-renders
 const userData = useMemo(() => ({
  fullName: user?.profile?.full_name,
  branchName: user?.profile?.branch_id // Use branch_id instead of home_branch?.name
 }), [user?.profile?.full_name, user?.profile?.branch_id])

 return (
  <Card className=" dark: dark:bg-black dark:border-gray-800">
   <CardContent className="p-0">
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
     <div className="flex justify-between items-center py-3 sm:py-4">
      <UserInfo 
       fullName={userData.fullName} 
      />
      <UserActions 
       branchName={userData.branchName} 
      />
     </div>

     <Separator className="dark:bg-gray-800" />

     <div className="px-2 sm:px-4 py-2">
      <Tabs value={pathname} onValueChange={handleNavigation}>
       <TabsList 
        className="grid w-full grid-cols-4 h-auto p-1 gap-2"
        role="tablist"
        aria-label="เมนูนำทางแดชบอร์ด"
       >
        {navigationItems.map(({ name, href, icon: Icon, ariaLabel }) => (
         <TabsTrigger
          key={name}
          value={href}
          className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2 px-3 sm:px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          aria-label={ariaLabel}
          data-testid={href === '/dashboard/work-history' ? 'nav-work-history' : href === '/dashboard' ? 'nav-dashboard' : undefined}
         >
          <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm text-center sm:text-left">{name}</span>
         </TabsTrigger>
        ))}
       </TabsList>
      </Tabs>
     </div>
    </div>
   </CardContent>
  </Card>
 )
}