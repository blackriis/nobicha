'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PayrollCalculationResponse, PayrollService } from '../services/payroll.service'

interface PayrollCalculationPreviewProps {
 cycleId: string;
 cycleName: string;
 onCalculationComplete?: (result: PayrollCalculationResponse) => void;
 onCancel?: () => void;
}

export default function PayrollCalculationPreview({ 
 cycleId, 
 cycleName, 
 onCalculationComplete, 
 onCancel 
}: PayrollCalculationPreviewProps) {
 const [isCalculating, setIsCalculating] = useState(false)
 const [calculationResult, setCalculationResult] = useState<PayrollCalculationResponse | null>(null)
 const [error, setError] = useState<string | null>(null)
 const [showDetails, setShowDetails] = useState(false)

 const handleCalculate = async () => {
  setIsCalculating(true)
  setError(null)
  
  try {
   const result = await PayrollService.calculatePayroll(cycleId)
   
   if (result.success) {
    setCalculationResult(result.data)
    onCalculationComplete?.(result.data)
   } else {
    setError(result.error || 'เกิดข้อผิดพลาดในการคำนวณเงินเดือน')
   }
  } catch (err) {
   setError('เกิดข้อผิดพลาดที่ไม่คาดคิด')
   console.error('Calculate payroll error:', err)
  } finally {
   setIsCalculating(false)
  }
 }

 const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
   style: 'currency',
   currency: 'THB',
   minimumFractionDigits: 2,
  }).format(amount);
 }

 const formatDate = (dateString: string): string => {
  try {
   return new Date(dateString).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
   });
  } catch {
   return dateString;
  }
 }

 const getMethodBadge = (method: string) => {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  
  switch (method) {
   case 'hourly':
    return (
     <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
      รายชั่วโมง
     </span>
    );
   case 'daily':
    return (
     <span className={`${baseClasses} bg-green-100 text-green-800`}>
      รายวัน
     </span>
    );
   case 'mixed':
    return (
     <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
      ผสม
     </span>
    );
   default:
    return (
     <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
      {method}
     </span>
    );
  }
 }

 if (!calculationResult) {
  return (
   <Card className="p-6">
    <div className="text-center">
     <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
       คำนวณเงินเดือนสำหรับ: {cycleName}
      </h3>
      <p className="text-sm text-gray-600">
       กดปุ่ม &ldquo;เริ่มคำนวณ&rdquo; เพื่อคำนวณเงินเดือนสำหรับรอบนี้
      </p>
     </div>

     {error && (
      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
       <p className="text-sm text-red-600">{error}</p>
      </div>
     )}

     <div className="flex justify-center gap-2">
      {onCancel && (
       <Button variant="outline" onClick={onCancel} disabled={isCalculating}>
        ยกเลิก
       </Button>
      )}
      <Button 
       onClick={handleCalculate} 
       disabled={isCalculating}
       className="min-w-[120px]"
      >
       {isCalculating ? 'กำลังคำนวณ...' : 'เริ่มคำนวณ'}
      </Button>
     </div>
    </div>
   </Card>
  )
 }

 const { calculation_summary, employee_calculations, payroll_cycle } = calculationResult

 return (
  <div className="space-y-6">
   {/* Summary Card */}
   <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
     <h3 className="text-lg font-semibold text-gray-900">
      ✅ คำนวณเงินเดือนเรียบร้อยแล้ว
     </h3>
     <div className="text-sm text-gray-500">
      {cycleName}
     </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
     <div className="bg-blue-50 p-4 rounded-lg">
      <div className="text-2xl font-bold text-blue-600">
       {calculation_summary.total_employees}
      </div>
      <div className="text-sm text-blue-800">จำนวนพนักงาน</div>
     </div>

     <div className="bg-green-50 p-4 rounded-lg">
      <div className="text-2xl font-bold text-green-600">
       {formatCurrency(calculation_summary.total_base_pay)}
      </div>
      <div className="text-sm text-green-800">ค่าแรงรวม</div>
     </div>

     <div className="bg-purple-50 p-4 rounded-lg">
      <div className="text-2xl font-bold text-purple-600">
       {formatCurrency(calculation_summary.total_base_pay / calculation_summary.total_employees)}
      </div>
      <div className="text-sm text-purple-800">ค่าแรงเฉลี่ย</div>
     </div>
    </div>

    <div className="text-sm text-gray-600 mb-4">
     <p>🗓️ ช่วงคำนวณ: {formatDate(calculation_summary.calculation_period.start_date)} - {formatDate(calculation_summary.calculation_period.end_date)}</p>
    </div>

    <div className="flex justify-between items-center">
     <Button
      variant="outline"
      size="sm"
      onClick={() => setShowDetails(!showDetails)}
     >
      {showDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียดพนักงาน'}
     </Button>
     
     {onCancel && (
      <Button variant="outline" onClick={onCancel}>
       ปิด
      </Button>
     )}
    </div>
   </Card>

   {/* Employee Details */}
   {showDetails && (
    <Card className="p-6">
     <h4 className="text-md font-semibold text-gray-900 mb-4">
      รายละเอียดการคำนวณพนักงาน
     </h4>
     
     <div className="space-y-3 max-h-96 overflow-y-auto">
      {employee_calculations.map((emp, index) => (
       <div key={emp.employee_id} className="border rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-start mb-2">
         <div>
          <div className="font-medium text-gray-900">{emp.full_name}</div>
          <div className="text-sm text-gray-600">
           {emp.total_days_worked} วันทำงาน • {emp.total_hours.toFixed(2)} ชั่วโมง
          </div>
         </div>
         <div className="text-right">
          <div className="font-semibold text-green-600">
           {formatCurrency(emp.base_pay)}
          </div>
          {getMethodBadge(emp.calculation_method)}
         </div>
        </div>
       </div>
      ))}
     </div>

     {employee_calculations.length === 0 && (
      <div className="text-center text-gray-500 py-8">
       <p>ไม่พบข้อมูลพนักงานสำหรับการคำนวณ</p>
      </div>
     )}
    </Card>
   )}
  </div>
 )
}