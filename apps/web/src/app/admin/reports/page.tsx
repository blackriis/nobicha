'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminReportsPage } from '@/components/admin/reports/AdminReportsPage'
import { AdminReportsErrorBoundary } from '@/components/admin/reports/ErrorBoundary'

export default function AdminReportsRoute() {
  return (
    <AdminLayout>
      <AdminReportsErrorBoundary>
        <AdminReportsPage />
      </AdminReportsErrorBoundary>
    </AdminLayout>
  )
}