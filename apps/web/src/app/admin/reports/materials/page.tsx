import { Suspense } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { MaterialDetailPage } from '@/components/admin/reports/MaterialDetailPage'

export default function MaterialReportsPage() {
 return (
  <AdminLayout>
   <Suspense fallback={<div>กำลังโหลด...</div>}>
    <MaterialDetailPage />
   </Suspense>
  </AdminLayout>
 )
}