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
    { label: 'แดชบอร์ด', href: '/admin', icon: Home, color: 'text-blue-600' },
    { label: 'จัดการสาขา', href: '/admin/branches', icon: Building2, color: 'text-green-600' },
    { label: 'จัดการพนักงาน', href: '/admin/employees', icon: Users, color: 'text-purple-600' },
    { label: 'จัดการวัตถุดิบ', href: '/admin/raw-materials', icon: Package, color: 'text-orange-600' },
    { label: 'จัดการเงินเดือน', href: '/admin/payroll', icon: Banknote, color: 'text-indigo-600' },
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    แดชบอร์ดผู้ดูแลระบบ
                  </h1>
                  {user?.profile && (
                    <p className="text-sm text-muted-foreground">
                      ยินดีต้อนรับ, {user.profile.full_name}
                    </p>
                  )}
                </div>
              </div>
              <Separator orientation="vertical" className="h-8" />
            </div>

            {/* Navigation Menu */}
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
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-[10px] text-destructive-foreground font-bold">2</span>
              </span>
            </Button>
            
            {/* User Badge */}
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="font-medium">ผู้ดูแลระบบ</span>
            </Badge>
            
            {/* Logout Button */}
            <LogoutButton variant="outline" size="sm" />
            
            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t py-3">
          <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const IconComponent = item.icon
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="flex-shrink-0 flex-col h-auto py-2 px-3 min-w-[80px]"
                >
                  <Link href={item.href} className="flex flex-col items-center gap-1">
                    <IconComponent className={`h-4 w-4 ${isActive ? '' : item.color}`} />
                    <span className="text-[10px] leading-tight text-center">{item.label.replace('จัดการ', '')}</span>
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}