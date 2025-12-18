'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
} from '@/components/ui/sheet'
import {
 Tooltip,
 TooltipContent,
 TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth, LogoutButton } from '@/components/auth'
import { useAdminStats } from '@/hooks/useAdminStats'
import {
 Settings,
 Bell,
 ChevronLeft,
 User,
 LogOut,
 Activity,
 Home,
 Building2,
 Users,
 Package,
 Banknote,
 BarChart3
} from 'lucide-react'

// Types
interface NavigationItem {
 label: string
 href: string
 icon: any
 description: string
 badge: string | null
}

interface NavigationGroup {
 title: string
 items: NavigationItem[]
}

interface SidebarContentProps {
 showHeader?: boolean
 collapsed?: boolean
 onToggle?: () => void
 navigationGroups: NavigationGroup[]
 adminActions: NavigationItem[]
 notificationsCount: number
 loading: boolean
 pathname: string
 user?: any
}

// Constants
const ADMIN_ACTIONS: NavigationItem[] = [
 { 
  label: 'รายงาน', 
  href: '/admin/reports', 
  icon: BarChart3, 
  description: 'รายงานและสถิติ',
  badge: null
 },
 { 
  label: 'ตั้งค่า', 
  href: '/admin/settings', 
  icon: Settings, 
  description: 'การตั้งค่าระบบ',
  badge: null
 },
]

// Sub Components
const SidebarHeader = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
 <div className="p-4 border-b border-sidebar-border">
  <div className="flex items-center justify-between">
   <div className={`flex items-center transition-all duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
    <div className="p-2 bg-sidebar-primary/10 rounded-lg mr-2">
     <Settings className="h-5 w-5 text-sidebar-primary" />
    </div>
    <div>
     <h1 className="font-semibold text-sm">ผู้ดูแลระบบ</h1>
     <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
    </div>
   </div>
   <div className="flex items-center gap-1">
    <ThemeToggle />
    <Tooltip>
     <TooltipTrigger asChild>
      <Button
       variant="ghost"
       size="sm"
       onClick={onToggle}
       className="hidden lg:flex h-8 w-8 p-0"
      >
       <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
      </Button>
     </TooltipTrigger>
     <TooltipContent>
      <p>{collapsed ? 'ขยายแถบด้านข้าง' : 'ยุบแถบด้านข้าง'}</p>
     </TooltipContent>
    </Tooltip>
   </div>
  </div>
 </div>
)

const UserInfo = ({ collapsed, user }: { collapsed: boolean; user?: any }) => (
 <div className="p-4 border-b border-sidebar-border">
  <div className={`flex items-center transition-all duration-200 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
   <div className="p-2 bg-sidebar-accent rounded-lg">
    <User className="h-4 w-4 text-sidebar-accent-foreground" />
   </div>
   {!collapsed && user?.profile && (
    <div className="flex-1 min-w-0">
     <p className="text-sm font-medium truncate">{user.profile.full_name}</p>
     <div className="flex items-center gap-1">
      <div className="h-2 w-2 bg-green-500 rounded-full" />
      <span className="text-xs text-sidebar-foreground/60">ออนไลน์</span>
     </div>
    </div>
   )}
  </div>
 </div>
)

const NavigationItem = ({ 
 item, 
 isActive, 
 collapsed 
}: { 
 item: NavigationItem
 isActive: boolean
 collapsed: boolean 
}) => {
 const IconComponent = item.icon
 
 return (
  <Link key={item.href} href={item.href}>
   <Tooltip>
    <TooltipTrigger asChild>
     <Button
      variant={isActive ? "default" : "ghost"}
      className={`w-full justify-start gap-3 h-auto py-3 px-3 ${
       collapsed ? 'px-3' : ''
      } ${isActive ? '' : ''}`}
      data-testid={item.href === '/admin/branches' ? 'nav-branches' : undefined}
     >
      <IconComponent className="h-4 w-4 flex-shrink-0" />
      {!collapsed && (
       <div className="flex-1 text-left">
        <div className="flex items-center justify-between">
         <span className="font-medium">{item.label}</span>
         {item.badge && (
          <Badge variant="secondary" className="text-xs">
           {item.badge}
          </Badge>
         )}
        </div>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">
         {item.description}
        </p>
       </div>
      )}
     </Button>
    </TooltipTrigger>
    {collapsed && (
     <TooltipContent side="right">
      <div>
       <p className="font-medium">{item.label}</p>
       <p className="text-xs text-sidebar-foreground/80">{item.description}</p>
       {item.badge && (
        <p className="text-xs mt-1">({item.badge})</p>
       )}
      </div>
     </TooltipContent>
    )}
   </Tooltip>
  </Link>
 )
}

const NavigationGroup = ({ 
 group, 
 collapsed, 
 pathname, 
 groupIndex, 
 totalGroups 
}: { 
 group: NavigationGroup
 collapsed: boolean
 pathname: string
 groupIndex: number
 totalGroups: number
}) => (
 <div key={group.title} className="space-y-2">
  <p className={`text-xs text-sidebar-foreground/60 font-medium ${collapsed ? 'text-center' : 'px-3'}`}>
   {collapsed ? '•••' : group.title}
  </p>
  
  <div className="space-y-1">
   {group.items.map((item) => (
    <NavigationItem
     key={item.href}
     item={item}
     isActive={pathname === item.href}
     collapsed={collapsed}
    />
   ))}
  </div>
  
  {groupIndex < totalGroups - 1 && (
   <Separator className="my-3" />
  )}
 </div>
)

const AdminActions = ({ 
 actions, 
 collapsed, 
 pathname 
}: { 
 actions: NavigationItem[]
 collapsed: boolean
 pathname: string
}) => (
 <div className="space-y-1">
  <p className={`text-xs text-sidebar-foreground/60 font-medium mb-2 ${collapsed ? 'text-center' : 'px-3'}`}>
   {collapsed ? '•••' : 'เครื่องมือ'}
  </p>
  {actions.map((item) => (
   <NavigationItem
    key={item.href}
    item={item}
    isActive={pathname === item.href}
    collapsed={collapsed}
   />
  ))}
 </div>
)

const SidebarFooter = ({ 
 collapsed, 
 notificationsCount, 
 loading 
}: { 
 collapsed: boolean
 notificationsCount: number
 loading: boolean 
}) => (
 <div className="p-4 border-t border-sidebar-border space-y-2">
  <Tooltip>
   <TooltipTrigger asChild>
    <Button variant="ghost" className={`w-full gap-3 ${collapsed ? 'px-3' : 'justify-start'}`}>
     <div className="relative">
      <Bell className="h-4 w-4" />
      {notificationsCount > 0 && (
       <div className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
      )}
     </div>
     {!collapsed && (
      <span className="text-sm">
       แจ้งเตือน ({loading ? '...' : notificationsCount})
      </span>
     )}
    </Button>
   </TooltipTrigger>
   {collapsed && (
    <TooltipContent>
     <p>แจ้งเตือน ({loading ? '...' : notificationsCount})</p>
    </TooltipContent>
   )}
  </Tooltip>

  <LogoutButton 
   variant="ghost" 
   size="sm"
   className={`w-full gap-3 ${collapsed ? 'px-3' : 'justify-start'}`}
  >
   <LogOut className="h-4 w-4" />
   {!collapsed && <span>ออกจากระบบ</span>}
  </LogoutButton>

  {!collapsed && (
   <div className="flex items-center justify-center gap-1 pt-2">
    <Activity className="h-3 w-3 text-green-500" />
    <span className="text-xs text-sidebar-foreground/60">
     ระบบทำงานปกติ
    </span>
   </div>
  )}
 </div>
)

const SidebarContent = ({ 
 showHeader = true, 
 collapsed = false,
 onToggle,
 navigationGroups,
 adminActions,
 notificationsCount,
 loading,
 pathname,
 user
}: SidebarContentProps) => (
 <div className="flex flex-col h-full">
  {showHeader && <SidebarHeader collapsed={collapsed} onToggle={onToggle || (() => {})} />}
  
  <UserInfo collapsed={collapsed} user={user} />
  
  <nav className="flex-1 p-4 space-y-4">
   {navigationGroups.map((group, index) => (
    <NavigationGroup
     key={group.title}
     group={group}
     collapsed={collapsed}
     pathname={pathname}
     groupIndex={index}
     totalGroups={navigationGroups.length}
    />
   ))}

   <Separator className="my-4" />

   <AdminActions 
    actions={adminActions}
    collapsed={collapsed}
    pathname={pathname}
   />
  </nav>

  <SidebarFooter 
   collapsed={collapsed}
   notificationsCount={notificationsCount}
   loading={loading}
  />
 </div>
)

// Main Component
interface AdminSidebarProps {
 className?: string
 mobileOpen?: boolean
 onMobileOpenChange?: (open: boolean) => void
}

export function AdminSidebar({ className, mobileOpen = false, onMobileOpenChange }: AdminSidebarProps) {
 const [collapsed, setCollapsed] = useState(false)
 const { user } = useAuth()
 const pathname = usePathname()
 const { branchesCount, employeesCount, materialsCount, payrollCyclesCount, notificationsCount, loading } = useAdminStats()

 const navigationGroups: NavigationGroup[] = [
  {
   title: 'ภาพรวม',
   items: [
    {
     label: 'แดชบอร์ด',
     href: '/admin',
     icon: Home,
     description: 'ภาพรวมระบบ',
     badge: null
    },
   ]
  },
  {
   title: 'การจัดการระบบ',
   items: [
    {
     label: 'จัดการสาขา',
     href: '/admin/branches',
     icon: Building2,
     description: 'สาขาและสถานที่',
     badge: loading ? '...' : (branchesCount > 0 ? branchesCount.toString() : null)
    },
    {
     label: 'จัดการพนักงาน',
     href: '/admin/employees',
     icon: Users,
     description: 'ข้อมูลพนักงาน',
     badge: loading ? '...' : (employeesCount > 0 ? employeesCount.toString() : null)
    },
    {
     label: 'จัดการวัตถุดิบ',
     href: '/admin/raw-materials',
     icon: Package,
     description: 'คลังวัตถุดิบ',
     badge: loading ? '...' : (materialsCount > 0 ? materialsCount.toString() : null)
    },
    {
     label: 'จัดการเงินเดือน',
     href: '/admin/payroll',
     icon: Banknote,
     description: 'เงินเดือนและโบนัส',
     badge: loading ? '...' : (payrollCyclesCount > 0 ? payrollCyclesCount.toString() : null)
    },
   ]
  }
 ]

 return (
  <>
   {/* Desktop Sidebar - Always visible on large screens */}
   <aside className={`hidden lg:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ${
    collapsed ? 'w-16' : 'w-64'
   } ${className}`}>
    <SidebarContent
     showHeader={true}
     collapsed={collapsed}
     onToggle={() => setCollapsed(!collapsed)}
     navigationGroups={navigationGroups}
     adminActions={ADMIN_ACTIONS}
     notificationsCount={notificationsCount}
     loading={loading}
     pathname={pathname}
     user={user}
    />
   </aside>

   {/* Mobile Sidebar Sheet */}
   <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
    <SheetContent
     side="left"
     className="w-64 bg-sidebar text-sidebar-foreground border-sidebar-border p-0"
    >
     <SheetHeader className="p-4 border-b border-sidebar-border">
      <div className="flex items-center justify-between">
       <SheetTitle className="font-semibold">Admin Panel</SheetTitle>
       <ThemeToggle />
      </div>
     </SheetHeader>
     <div className="flex-1 overflow-y-auto h-[calc(100vh-5rem)]">
      <SidebarContent
       showHeader={false}
       collapsed={false}
       navigationGroups={navigationGroups}
       adminActions={ADMIN_ACTIONS}
       notificationsCount={notificationsCount}
       loading={loading}
       pathname={pathname}
       user={user}
      />
     </div>
    </SheetContent>
   </Sheet>
  </>
 )
}