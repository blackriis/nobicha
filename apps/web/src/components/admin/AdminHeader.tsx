'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, LogoutButton } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
 Home,
 Building2,
 Package,
 Banknote,
 Users,
 Settings,
 Bell,
 Menu,
 ChevronDown
} from 'lucide-react'

export function AdminHeader() {
 const { user } = useAuth()
 const pathname = usePathname()

 const navigationItems = [
  { label: 'แดชบอร์ด', href: '/admin', icon: Home, color: 'text-blue-600', shortLabel: 'หน้าแรก' },
  { label: 'จัดการสาขา', href: '/admin/branches', icon: Building2, color: 'text-green-600', shortLabel: 'สาขา' },
  { label: 'จัดการพนักงาน', href: '/admin/employees', icon: Users, color: 'text-purple-600', shortLabel: 'พนักงาน' },
  { label: 'จัดการวัตถุดิบ', href: '/admin/raw-materials', icon: Package, color: 'text-orange-600', shortLabel: 'วัตถุดิบ' },
  { label: 'จัดการเงินเดือน', href: '/admin/payroll', icon: Banknote, color: 'text-indigo-600', shortLabel: 'เงินเดือน' },
 ]

 return (
  <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
   <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
    {/* Main Header - แถบบน */}
    <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
     {/* Logo & Title Section */}
     <div className="flex items-center gap-2 sm:gap-4 min-w-0">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
       <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
        <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
       </div>
       <div className="min-w-0">
        <h1 className="text-sm sm:text-lg md:text-xl font-semibold tracking-tight truncate">
         แดชบอร์ดผู้ดูแลระบบ
        </h1>
        {user?.profile && (
         <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
          ยินดีต้อนรับ, {user.profile.full_name}
         </p>
        )}
       </div>
      </div>
      <Separator orientation="vertical" className="h-8 hidden md:block" />
      
      {/* Desktop Navigation Menu */}
      <nav className="hidden lg:flex items-center space-x-1">
       {navigationItems.map((item) => {
        const isActive = pathname === item.href
        const IconComponent = item.icon
        return (
         <Button
          key={item.href}
          asChild
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className={`flex items-center gap-2 px-3 py-2 transition-all duration-200 ${
           isActive ? '' : 'hover:bg-accent hover:text-accent-foreground'
          }`}
         >
          <Link href={item.href}>
           <IconComponent className={`h-4 w-4 ${isActive ? '' : item.color}`} />
           <span className="font-medium">{item.label}</span>
          </Link>
         </Button>
        )
       })}
      </nav>
     </div>
     
     {/* Right Section - Notifications & User */}
     <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
      {/* Notifications */}
      <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0 sm:h-9 sm:w-9">
       <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
       <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-destructive rounded-full flex items-center justify-center">
        <span className="text-[8px] sm:text-[10px] text-destructive-foreground font-bold">2</span>
       </span>
      </Button>
      
      {/* User Badge - Hidden on small screens */}
      <Badge variant="secondary" className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5">
       <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full" />
       <span className="text-xs sm:text-sm font-medium">ผู้ดูแลระบบ</span>
      </Badge>
      
      {/* Logout Button */}
      <LogoutButton variant="outline" size="sm" className="h-8 text-xs sm:h-9 sm:text-sm px-2 sm:px-3" />
     </div>
    </div>

    {/* Mobile Navigation - แถบเมนูด้านล่าง (รองรับทุกขนาดหน้าจอ) */}
    <div className="lg:hidden border-t py-2 sm:py-3 -mx-2 sm:mx-0">
     <div className="px-2 sm:px-0">
      <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide pb-1">
       {navigationItems.map((item) => {
        const isActive = pathname === item.href
        const IconComponent = item.icon
        return (
         <Button
          key={item.href}
          asChild
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className="flex-shrink-0 flex-col h-auto py-1.5 sm:py-2 px-2 sm:px-3 min-w-[60px] sm:min-w-[70px] gap-0.5 sm:gap-1"
         >
          <Link href={item.href} className="flex flex-col items-center gap-0.5 sm:gap-1">
           <IconComponent className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? '' : item.color}`} />
           <span className="text-[9px] sm:text-[10px] leading-tight text-center whitespace-nowrap">
            {item.shortLabel}
           </span>
          </Link>
         </Button>
        )
       })}
      </nav>
     </div>
    </div>
   </div>
  </header>
 )
}