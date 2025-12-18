'use client'

import { useAuth, LogoutButton } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
 Bell,
 Menu
} from 'lucide-react'

interface AdminHeaderProps {
 onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
 const { user } = useAuth()

 return (
  <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm lg:hidden">
   <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
    {/* Main Header - แถบบน */}
    <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">
     {/* Logo & Title Section */}
     <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      {/* Mobile Menu Toggle - Opens AdminSidebar */}
      <Button
       variant="ghost"
       size="icon"
       onClick={onMenuClick}
       className="flex-shrink-0"
      >
       <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0">
       <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
        แดชบอร์ดผู้ดูแลระบบ
       </h1>
       {user?.profile && (
        <p className="text-xs text-muted-foreground truncate hidden sm:block">
         ยินดีต้อนรับ, {user.profile.full_name}
        </p>
       )}
      </div>
     </div>

     {/* Right Section - Notifications & User */}
     <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
       <Bell className="h-4 w-4" />
       <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
        <span className="text-[10px] text-destructive-foreground font-bold">2</span>
       </span>
      </Button>

      {/* User Badge - Hidden on small screens */}
      <Badge variant="secondary" className="hidden md:flex items-center gap-2 px-3 py-1.5">
       <div className="h-2 w-2 bg-green-500 rounded-full" />
       <span className="text-sm font-medium">ผู้ดูแลระบบ</span>
      </Badge>

      {/* Logout Button */}
      <LogoutButton variant="outline" size="sm" className="h-9" />
     </div>
    </div>
   </div>
  </header>
 )
}