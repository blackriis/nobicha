import { AdminLayout } from '@/components/admin/AdminLayout'
import { AddEmployeePage } from '@/components/admin/AddEmployeePage'

export default function AddEmployee() {
 return (
  <AdminLayout>
   <AddEmployeePage />
  </AdminLayout>
 )
}

export const metadata = {
 title: 'เพิ่มพนักงานใหม่ | ระบบบริหารจัดการพนักงาน',
 description: 'เพิ่มพนักงานใหม่และกำหนดอัตราค่าแรง'
}