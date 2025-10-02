'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { EmployeeListPage } from '@/components/admin/EmployeeListPage'

export default function EmployeesPage() {
  return (
    <AdminLayout>
      <EmployeeListPage />
    </AdminLayout>
  )
}