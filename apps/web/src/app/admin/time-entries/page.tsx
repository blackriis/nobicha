'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminTimeEntriesPage } from '@/components/admin/AdminTimeEntriesPage'

export default function TimeEntriesRoute() {
  return (
    <AdminLayout>
      <AdminTimeEntriesPage />
    </AdminLayout>
  )
}