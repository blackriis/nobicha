'use client'

import { ProtectedRoute } from '@/components/auth'
import { EmployeeDashboardHeader } from '@/components/dashboard/EmployeeDashboardHeader'
import { MaterialUsageForm } from '@/components/employee/MaterialUsageForm'

export default function MaterialUsagePage() {

 return (
  <ProtectedRoute allowedRoles={['employee']}>
   <div className="min-h-screen bg-gray-50 dark:bg-black">
    <EmployeeDashboardHeader />
    
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
     {/* Header */}
     <div className="flex justify-between items-center">
      <div>
       <h1 className="text-2xl font-bold text-gray-900">รายงานการใช้วัตถุดิบ</h1>
       <p className="text-sm text-gray-600 mt-1">
        บันทึกการใช้วัตถุดิบในระหว่างการทำงาน เพื่อการติดตามต้นทุนที่แม่นยำ
       </p>
      </div>
     </div>

     {/* Main Content */}
     <MaterialUsageForm />
    </div>
   </div>
  </ProtectedRoute>
 )
}