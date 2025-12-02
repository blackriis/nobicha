'use client'

import { ProtectedRoute } from '@/components/auth'
import { EmployeeDashboardHeader } from '@/components/dashboard/EmployeeDashboardHeader'
import { MaterialUsageForm } from '@/components/employee/MaterialUsageForm'

export default function MaterialUsagePage() {

 return (
  <ProtectedRoute allowedRoles={['employee']}>
   <div className="min-h-screen bg-gray-50 dark:bg-black">
    <EmployeeDashboardHeader />

    <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8 space-y-4 sm:space-y-6">
     {/* Header */}
     <div className="flex flex-col gap-2">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
       รายงานการใช้วัตถุดิบ
      </h1>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
       บันทึกการใช้วัตถุดิบในระหว่างการทำงาน เพื่อการติดตามต้นทุนที่แม่นยำ
      </p>
     </div>

     {/* Main Content */}
     <MaterialUsageForm />
    </div>
   </div>
  </ProtectedRoute>
 )
}