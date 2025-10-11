import { AdminLayout } from '@/components/admin/AdminLayout'
import { EditEmployeePage } from '@/components/admin/EditEmployeePage'

interface EditEmployeeProps {
 params: {
  id: string
 }
}

export default function EditEmployee({ params }: EditEmployeeProps) {
 return (
  <AdminLayout>
   <EditEmployeePage employeeId={params.id} />
  </AdminLayout>
 )
}

export const metadata = {
 title: 'แก้ไขข้อมูลพนักงาน | ระบบบริหารจัดการพนักงาน',
 description: 'แก้ไขข้อมูลและอัตราค่าแรงของพนักงาน'
}