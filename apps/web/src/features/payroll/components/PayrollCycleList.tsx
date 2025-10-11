'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PayrollService } from '../services/payroll.service'
import type { PayrollCycle } from '@employee-management/database'

interface PayrollCycleListProps {
 onSelectCycle?: (cycle: PayrollCycle) => void;
 onCalculatePayroll?: (cycleId: string) => void;
 onFinalizeCycle?: (cycle: PayrollCycle) => void;
 onExportCycle?: (cycle: PayrollCycle) => void;
 onManageBonusDeduction?: (cycle: PayrollCycle) => void;
 onResetCycle?: (cycle: PayrollCycle) => void;
 refreshTrigger?: number;
}

interface CycleListItemProps {
 cycle: PayrollCycle;
 onSelect?: () => void;
 onCalculate?: () => void;
 onFinalize?: () => void;
 onExport?: () => void;
 onManageBonusDeduction?: () => void;
 onReset?: () => void;
 isCalculating?: boolean;
}

function CycleListItem({ 
 cycle, 
 onSelect, 
 onCalculate, 
 onFinalize, 
 onExport, 
 onManageBonusDeduction,
 onReset, 
 isCalculating 
}: CycleListItemProps) {
 const formatDateThai = (dateString: string): string => {
  try {
   const date = new Date(dateString);
   return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
   });
  } catch {
   return dateString;
  }
 };

 const calculatePeriodDays = (startDate: string, endDate: string): number => {
  try {
   const start = new Date(startDate);
   const end = new Date(endDate);
   const diffTime = end.getTime() - start.getTime();
   return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } catch {
   return 0;
  }
 };

 const getStatusBadge = (status: string) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  
  switch (status) {
   case 'active':
    return (
     <span className={`${baseClasses} bg-green-100 text-green-800`}>
      ใช้งานได้
     </span>
    );
   case 'completed':
    return (
     <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
      เสร็จสิ้น
     </span>
    );
   default:
    return (
     <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
      {status}
     </span>
    );
  }
 };

 const periodDays = calculatePeriodDays(cycle.start_date, cycle.end_date);

 return (
  <Card className="p-4 ">
   <div className="flex items-start justify-between">
    <div className="flex-1">
     <div className="flex items-center gap-2 mb-2">
      <h4 className="font-semibold text-gray-900">{cycle.name}</h4>
      {getStatusBadge(cycle.status)}
     </div>
     
     <div className="text-sm text-gray-600 space-y-1">
      <div className="flex items-center gap-4">
       <span>📅 {formatDateThai(cycle.start_date)} - {formatDateThai(cycle.end_date)}</span>
       <span>📊 {periodDays} วัน</span>
      </div>
      
      <div className="flex items-center text-xs text-gray-500">
       <span>สร้างเมื่อ: {formatDateThai(cycle.created_at)}</span>
      </div>
     </div>
    </div>

    <div className="flex items-center gap-2 ml-4">
     {/* Export button - available for all cycles */}
     {onExport && (
      <Button
       variant="outline"
       size="sm"
       onClick={onExport}
       className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
      >
       📊 ส่งออก
      </Button>
     )}

     {/* Active cycle actions */}
     {cycle.status === 'active' && (
      <>
       {onManageBonusDeduction && (
        <Button
         variant="outline"
         size="sm"
         onClick={onManageBonusDeduction}
         className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
        >
         💰 โบนัส/หักเงิน
        </Button>
       )}

       {onCalculate && (
        <Button
         variant="default"
         size="sm"
         onClick={onCalculate}
         disabled={isCalculating}
         className="bg-blue-600 hover:bg-blue-700"
        >
         {isCalculating ? 'กำลังคำนวณ...' : '⚡ คำนวณ'}
        </Button>
       )}

       {onReset && (
        <Button
         variant="outline"
         size="sm"
         onClick={onReset}
         className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
        >
         🗑️ รีเซ็ต
        </Button>
       )}

       {onFinalize && (
        <Button
         variant="default"
         size="sm"
         onClick={onFinalize}
         className="bg-green-600 hover:bg-green-700"
        >
         🔒 ปิดรอบ
        </Button>
       )}
      </>
     )}

     {/* Completed cycle actions */}
     {cycle.status === 'completed' && onSelect && (
      <Button
       variant="outline"
       size="sm"
       onClick={onSelect}
      >
       👁️ ดูรายละเอียด
      </Button>
     )}
    </div>
   </div>
  </Card>
 );
}

export default function PayrollCycleList({ 
 onSelectCycle, 
 onCalculatePayroll,
 onFinalizeCycle,
 onExportCycle,
 onManageBonusDeduction,
 refreshTrigger = 0 
}: PayrollCycleListProps) {
 const [cycles, setCycles] = useState<PayrollCycle[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [calculatingCycles, setCalculatingCycles] = useState<Set<string>>(new Set())

 const fetchCycles = async () => {
  setIsLoading(true)
  setError(null)
  
  try {
   const result = await PayrollService.getPayrollCycles()
   
   if (result.success) {
    setCycles(result.data.payroll_cycles)
   } else {
    setError(result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลรอบการจ่ายเงินเดือน')
   }
  } catch (err) {
   setError('เกิดข้อผิดพลาดที่ไม่คาดคิด')
   console.error('Fetch payroll cycles error:', err)
  } finally {
   setIsLoading(false)
  }
 }

 const handleCalculatePayroll = async (cycleId: string) => {
  setCalculatingCycles(prev => new Set([...prev, cycleId]))
  
  try {
   if (onCalculatePayroll) {
    await onCalculatePayroll(cycleId)
    // Refresh the list after calculation
    await fetchCycles()
   }
  } finally {
   setCalculatingCycles(prev => {
    const newSet = new Set(prev)
    newSet.delete(cycleId)
    return newSet
   })
  }
 }

 useEffect(() => {
  fetchCycles()
 }, [refreshTrigger])

 if (isLoading) {
  return (
   <div className="space-y-4">
    {[1, 2, 3].map((i) => (
     <Card key={i} className="p-4">
      <div className="animate-pulse space-y-3">
       <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
       </div>
       <div className="h-3 bg-gray-200 rounded w-2/3"></div>
       <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
     </Card>
    ))}
   </div>
  )
 }

 if (error) {
  return (
   <Card className="p-6 text-center">
    <div className="text-red-600 mb-4">
     <p className="font-medium">เกิดข้อผิดพลาด</p>
     <p className="text-sm mt-1">{error}</p>
    </div>
    <Button onClick={fetchCycles} variant="outline">
     ลองใหม่
    </Button>
   </Card>
  )
 }

 if (cycles.length === 0) {
  return (
   <Card className="p-8 text-center">
    <div className="text-gray-500">
     <div className="text-4xl mb-4">📊</div>
     <p className="text-lg font-medium mb-2">ยังไม่มีรอบการจ่ายเงินเดือน</p>
     <p className="text-sm">สร้างรอบการจ่ายเงินเดือนใหม่เพื่อเริ่มต้นการคำนวณ</p>
    </div>
   </Card>
  )
 }

 return (
  <div className="space-y-4">
   <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-gray-900">
     รอบการจ่ายเงินเดือน ({cycles.length})
    </h3>
    <Button onClick={fetchCycles} variant="outline" size="sm">
     รีเฟรช
    </Button>
   </div>

   <div className="space-y-3">
    {cycles.map((cycle) => (
     <CycleListItem
      key={cycle.id}
      cycle={cycle}
      onSelect={() => onSelectCycle?.(cycle)}
      onCalculate={() => handleCalculatePayroll(cycle.id)}
      onFinalize={() => onFinalizeCycle?.(cycle)}
      onExport={() => onExportCycle?.(cycle)}
      onManageBonusDeduction={() => onManageBonusDeduction?.(cycle)}
      onReset={() => onResetCycle?.(cycle)}
      isCalculating={calculatingCycles.has(cycle.id)}
     />
    ))}
   </div>
  </div>
 )
}