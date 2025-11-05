import { AdminLayout } from '@/components/admin/AdminLayout'
import { EditEmployeePage } from '@/components/admin/EditEmployeePage'

interface EditEmployeeProps {
 params: Promise<{
  id: string
 }>
}

export default async function EditEmployee({ params }: EditEmployeeProps) {
 // Await params before using (Next.js 15 requires params to be a Promise)
 const { id } = await params
 return (
  <AdminLayout>
   <EditEmployeePage employeeId={id} />
  </AdminLayout>
 )
}

export const metadata = {
 title: 'แก้ไขข้อมูลพนักงาน | ระบบบริหารจัดการพนักงาน',
 description: 'แก้ไขข้อมูลและอัตราค่าแรงของพนักงาน'
}