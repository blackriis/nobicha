'use client'

import { ReactNode, useState } from 'react'
import { ProtectedRoute } from '@/components/auth'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { AdminBreadcrumb } from './AdminBreadcrumb'

interface AdminLayoutProps {
 children: ReactNode
 'data-testid'?: string
}

export function AdminLayout({ children, 'data-testid': dataTestId }: AdminLayoutProps) {
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

 return (
  <ProtectedRoute allowedRoles={['admin']}>
   <div className="min-h-screen bg-background flex">
    {/* Sidebar - Desktop + Mobile Sheet */}
    <AdminSidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} />

    {/* Main Content */}
    <div className="flex-1 flex flex-col min-w-0">
     {/* Header - Mobile Navigation */}
     <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />

     {/* Page Content */}
     <main className="flex-1 overflow-auto" data-testid={dataTestId}>
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
       <AdminBreadcrumb />
       {children}
      </div>
     </main>
    </div>
   </div>
  </ProtectedRoute>
 )
}