'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PayrollEmployeeListItem } from '../services/payroll.service'
import { PayrollDetailUtils } from '../utils/payroll-detail.utils'

interface PayrollEmployeeListProps {
 employees: PayrollEmployeeListItem[]
 isLoading?: boolean
 onEditBonus: (employee: PayrollEmployeeListItem) => void
 onEditDeduction: (employee: PayrollEmployeeListItem) => void
 onDeleteBonus: (employee: PayrollEmployeeListItem) => void
 onDeleteDeduction: (employee: PayrollEmployeeListItem) => void
 cycleStatus: 'active' | 'completed'
}

interface EmployeeRowProps {
 employee: PayrollEmployeeListItem
 onEditBonus: (employee: PayrollEmployeeListItem) => void
 onEditDeduction: (employee: PayrollEmployeeListItem) => void
 onDeleteBonus: (employee: PayrollEmployeeListItem) => void
 onDeleteDeduction: (employee: PayrollEmployeeListItem) => void
 isReadOnly: boolean
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({
 employee,
 onEditBonus,
 onEditDeduction,
 onDeleteBonus,
 onDeleteDeduction,
 isReadOnly,
}) => {
 const lowPayWarning = PayrollDetailUtils.generateLowNetPayWarning(
  employee.net_pay,
  employee.base_pay
 )

 return (
  <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50">
   {/* ชื่อพนักงาน */}
   <div className="col-span-3">
    <div className="font-medium text-gray-900">{employee.full_name}</div>
    {lowPayWarning && (
     <div className="text-xs text-orange-600 mt-1">{lowPayWarning}</div>
    )}
   </div>

   {/* เงินเดือนพื้นฐาน */}
   <div className="col-span-2 text-right">
    <div className="text-sm text-gray-600">เงินเดือนพื้นฐาน</div>
    <div className="font-medium">
     {PayrollDetailUtils.formatCurrency(employee.base_pay)}
    </div>
   </div>

   {/* โบนัส */}
   <div className="col-span-2">
    <div className="text-sm text-gray-600">โบนัส</div>
    <div className="flex items-center justify-between">
     <div>
      {employee.bonus > 0 ? (
       <div>
        <div className="font-medium text-green-600">
         {PayrollDetailUtils.formatCurrency(employee.bonus)}
        </div>
        {employee.bonus_reason && (
         <div className="text-xs text-gray-500 truncate" title={employee.bonus_reason}>
          {employee.bonus_reason}
         </div>
        )}
       </div>
      ) : (
       <div className="text-sm text-gray-400">ไม่มี</div>
      )}
     </div>
     {!isReadOnly && (
      <div className="flex space-x-1">
       <Button
        size="sm"
        variant="outline"
        onClick={() => onEditBonus(employee)}
        className="h-6 px-2 text-xs"
       >
        {employee.bonus > 0 ? 'แก้ไข' : 'เพิ่ม'}
       </Button>
       {employee.bonus > 0 && (
        <Button
         size="sm"
         variant="outline"
         onClick={() => onDeleteBonus(employee)}
         className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
        >
         ลบ
        </Button>
       )}
      </div>
     )}
    </div>
   </div>

   {/* หักเงิน */}
   <div className="col-span-2">
    <div className="text-sm text-gray-600">หักเงิน</div>
    <div className="flex items-center justify-between">
     <div>
      {employee.deduction > 0 ? (
       <div>
        <div className="font-medium text-red-600">
         {PayrollDetailUtils.formatCurrency(employee.deduction)}
        </div>
        {employee.deduction_reason && (
         <div className="text-xs text-gray-500 truncate" title={employee.deduction_reason}>
          {employee.deduction_reason}
         </div>
        )}
       </div>
      ) : (
       <div className="text-sm text-gray-400">ไม่มี</div>
      )}
     </div>
     {!isReadOnly && (
      <div className="flex space-x-1">
       <Button
        size="sm"
        variant="outline"
        onClick={() => onEditDeduction(employee)}
        className="h-6 px-2 text-xs"
       >
        {employee.deduction > 0 ? 'แก้ไข' : 'เพิ่ม'}
       </Button>
       {employee.deduction > 0 && (
        <Button
         size="sm"
         variant="outline"
         onClick={() => onDeleteDeduction(employee)}
         className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
        >
         ลบ
        </Button>
       )}
      </div>
     )}
    </div>
   </div>

   {/* เงินเดือนสุทธิ */}
   <div className="col-span-3 text-right">
    <div className="text-sm text-gray-600">เงินเดือนสุทธิ</div>
    <div className={`font-bold text-lg ${
     employee.net_pay < employee.base_pay * 0.5 
      ? 'text-red-600' 
      : employee.net_pay < employee.base_pay * 0.7 
      ? 'text-orange-600' 
      : 'text-green-600'
    }`}>
     {PayrollDetailUtils.formatCurrency(employee.net_pay)}
    </div>
   </div>
  </div>
 )
}

export const PayrollEmployeeList: React.FC<PayrollEmployeeListProps> = ({
 employees,
 isLoading = false,
 onEditBonus,
 onEditDeduction,
 onDeleteBonus,
 onDeleteDeduction,
 cycleStatus,
}) => {
 const isReadOnly = cycleStatus === 'completed'
 
 // คำนวณสรุปข้อมูล
 const summary = employees.length > 0 ? PayrollDetailUtils.createPayrollDetailsSummary(
  employees.map(emp => ({
   id: emp.id,
   payroll_cycle_id: '',
   user_id: emp.user_id,
   base_pay: emp.base_pay,
   overtime_hours: 0,
   overtime_rate: 0,
   overtime_pay: 0,
   bonus: emp.bonus,
   bonus_reason: emp.bonus_reason,
   deduction: emp.deduction,
   deduction_reason: emp.deduction_reason,
   net_pay: emp.net_pay,
   created_at: '',
  }))
 ) : null

 if (isLoading) {
  return (
   <Card className="p-6">
    <div className="animate-pulse">
     <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
     <div className="space-y-3">
      {[1, 2, 3].map((i) => (
       <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
     </div>
    </div>
   </Card>
  )
 }

 if (employees.length === 0) {
  return (
   <Card className="p-6">
    <div className="text-center py-8">
     <div className="text-gray-500 mb-2">ไม่พบข้อมูลพนักงานในรอบนี้</div>
     <div className="text-sm text-gray-400">
      กรุณาตรวจสอบการคำนวณเงินเดือนหรือช่วงเวลาของรอบ
     </div>
    </div>
   </Card>
  )
 }

 return (
  <Card className="overflow-hidden">
   {/* Header */}
   <div className="bg-gray-50 p-4 border-b">
    <div className="flex justify-between items-center mb-2">
     <h3 className="text-lg font-semibold text-gray-900">
      รายการพนักงาน ({employees.length} คน)
     </h3>
     {isReadOnly && (
      <div className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-600">
       รอบปิดแล้ว - ไม่สามารถแก้ไขได้
      </div>
     )}
    </div>
    
    {summary && (
     <div className="grid grid-cols-4 gap-4 text-sm">
      <div>
       <span className="text-gray-600">รวมเงินเดือนพื้นฐาน: </span>
       <span className="font-medium">
        {PayrollDetailUtils.formatCurrency(summary.total_base_pay)}
       </span>
      </div>
      <div>
       <span className="text-gray-600">รวมโบนัส: </span>
       <span className="font-medium text-green-600">
        {PayrollDetailUtils.formatCurrency(summary.total_bonus)}
       </span>
      </div>
      <div>
       <span className="text-gray-600">รวมหักเงิน: </span>
       <span className="font-medium text-red-600">
        {PayrollDetailUtils.formatCurrency(summary.total_deduction)}
       </span>
      </div>
      <div>
       <span className="text-gray-600">รวมสุทธิ: </span>
       <span className="font-bold text-blue-600">
        {PayrollDetailUtils.formatCurrency(summary.total_net_pay)}
       </span>
      </div>
     </div>
    )}
   </div>

   {/* Column Headers */}
   <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 border-b font-medium text-sm text-gray-700">
    <div className="col-span-3">ชื่อพนักงาน</div>
    <div className="col-span-2 text-right">เงินเดือนพื้นฐาน</div>
    <div className="col-span-2">โบนัส</div>
    <div className="col-span-2">หักเงิน</div>
    <div className="col-span-3 text-right">เงินเดือนสุทธิ</div>
   </div>

   {/* Employee Rows */}
   <div className="divide-y divide-gray-200">
    {employees.map((employee) => (
     <EmployeeRow
      key={employee.id}
      employee={employee}
      onEditBonus={onEditBonus}
      onEditDeduction={onEditDeduction}
      onDeleteBonus={onDeleteBonus}
      onDeleteDeduction={onDeleteDeduction}
      isReadOnly={isReadOnly}
     />
    ))}
   </div>
  </Card>
 )
}