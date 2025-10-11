'use client'

import { useAuth, LogoutButton } from '@/components/auth'
import ThemeSwitcher from '@/components/ui/theme-switcher'
import { useMemo } from 'react'

interface UserInfoProps {
 fullName?: string
}

interface UserActionsProps {
 branchName?: string
}

// Memoized user info section to prevent unnecessary re-renders
const UserInfo = ({ fullName }: UserInfoProps) => (
 <section>
  <h1 className="text-2xl font-bold text-foreground">
   แดชบอร์ดพนักงาน
  </h1>
  {fullName && (
   <p className="text-sm text-muted-foreground">
    ยินดีต้อนรับ, {fullName}
   </p>
  )}
 </section>
)

// Memoized user actions section
const UserActions = ({ branchName }: UserActionsProps) => (
 <aside className="flex items-center space-x-4">
  {branchName && (
   <span className="text-sm text-muted-foreground" aria-label="สาขาปัจจุบัน">
    สาขา: {branchName}
   </span>
  )}
  <ThemeSwitcher />
  <LogoutButton variant="outline" />
 </aside>
)

export function DashboardHeader() {
 const { user } = useAuth()

 // Memoize user data to prevent unnecessary re-renders
 const userData = useMemo(() => ({
  fullName: user?.profile?.full_name,
  branchName: user?.profile?.branch_id || 'ไม่ระบุ' // Use branch_id instead of home_branch?.name
 }), [user?.profile?.full_name, user?.profile?.branch_id])

 return (
  <header className="bg-background dark:bg-black border-b dark:border-gray-800">
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
    <UserInfo fullName={userData.fullName} />
    <UserActions branchName={userData.branchName} />
   </div>
  </header>
 )
}