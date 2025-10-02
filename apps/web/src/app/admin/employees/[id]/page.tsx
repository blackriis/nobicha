'use client'

import { use } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EmployeeDetailPage } from '@/components/admin/EmployeeDetailPage'

interface EmployeeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EmployeeDetailPageRoute({ params }: EmployeeDetailPageProps) {
  const { id } = use(params)
  
  return (
    <AdminLayout>
      <EmployeeDetailPage employeeId={id} />
    </AdminLayout>
  )
}
