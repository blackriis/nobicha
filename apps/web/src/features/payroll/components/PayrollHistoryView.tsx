'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type PayrollCycle } from '../services/payroll-export.service'
import { payrollExportService } from '../services/payroll-export.service'

interface PayrollHistoryViewProps {
 onSelectCycle?: (cycle: PayrollCycle) => void
 onExportCycle?: (cycleId: string, cycleName: string) => void
}

export default function PayrollHistoryView({ 
 onSelectCycle, 
 onExportCycle 
}: PayrollHistoryViewProps) {
 const [cycles, setCycles] = useState<PayrollCycle[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [expandedCycle, setExpandedCycle] = useState<string | null>(null)

 useEffect(() => {
  loadHistoricalCycles()
 }, [])

 const loadHistoricalCycles = async () => {
  setLoading(true)
  setError(null)

  try {
   const historicalCycles = await payrollExportService.getHistoricalCycles(20) // Get last 20 cycles
   setCycles(historicalCycles)
  } catch (err) {
   setError('เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ')
   console.error('Load historical cycles error:', err)
  } finally {
   setLoading(false)
  }
 }

 const formatDate = (dateString: string): string => {
  try {
   return new Date(dateString).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
   })
  } catch {
   return dateString
  }
 }

 const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
   style: 'currency',
   currency: 'THB',
   minimumFractionDigits: 2,
  }).format(amount)
 }

 const getStatusBadge = (status: string) => {
  switch (status) {
   case 'completed':
    return <Badge className="bg-green-100 text-green-800">ปิดรอบแล้ว</Badge>
   case 'active':
    return <Badge className="bg-blue-100 text-blue-800">กำลังดำเนินการ</Badge>
   default:
    return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
  }
 }

 const calculateDuration = (startDate: string, endDate: string): number => {
  try {
   const start = new Date(startDate)
   const end = new Date(endDate)
   const diffTime = end.getTime() - start.getTime()
   return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch {
   return 0
  }
 }

 if (loading) {
  return (
   <Card className="p-6">
    <div className="animate-pulse">
     <div className="h-6 bg-gray-200 rounded mb-4"></div>
     <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
       <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
     </div>
    </div>
   </Card>
  )
 }

 if (error) {
  return (
   <Card className="p-6">
    <div className="text-center">
     <div className="text-red-600 mb-4">
      <p className="font-medium">เกิดข้อผิดพลาด</p>
      <p className="text-sm">{error}</p>
     </div>
     <Button onClick={loadHistoricalCycles} variant="outline">
      ลองใหม่
     </Button>
    </div>
   </Card>
  )
 }

 if (cycles.length === 0) {
  return (
   <Card className="p-6">
    <div className="text-center text-gray-500">
     <div className="text-4xl mb-2">📊</div>
     <p className="font-medium">ยังไม่มีประวัติรอบการจ่ายเงินเดือนที่ปิดแล้ว</p>
     <p className="text-sm">เมื่อปิดรอบการจ่ายเงินเดือนแล้ว ประวัติจะแสดงที่นี่</p>
    </div>
   </Card>
  )
 }

 return (
  <Card className="p-6">
   <div className="flex items-center justify-between mb-6">
    <div>
     <h3 className="text-lg font-semibold text-gray-900 mb-2">
      ประวัติรอบการจ่ายเงินเดือน
     </h3>
     <p className="text-sm text-gray-600">
      รอบที่ปิดแล้ว {cycles.length} รอบ
     </p>
    </div>
    <Button
     onClick={loadHistoricalCycles}
     variant="outline"
     size="sm"
    >
     🔄 รีเฟรช
    </Button>
   </div>

   <div className="space-y-4">
    {cycles.map((cycle) => (
     <div 
      key={cycle.id} 
      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
     >
      {/* Cycle Header */}
      <div className="flex items-center justify-between mb-3">
       <div className="flex-1">
        <div className="flex items-center space-x-3 mb-1">
         <h4 className="font-medium text-gray-900">{cycle.cycle_name}</h4>
         {getStatusBadge(cycle.status)}
        </div>
        <div className="text-sm text-gray-600">
         <span>📅 {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}</span>
         <span className="mx-2">•</span>
         <span>{calculateDuration(cycle.start_date, cycle.end_date)} วัน</span>
         {cycle.finalized_at && (
          <>
           <span className="mx-2">•</span>
           <span>ปิดรอบ: {formatDate(cycle.finalized_at)}</span>
          </>
         )}
        </div>
       </div>
       
       <div className="flex items-center space-x-2">
        <Button
         onClick={() => setExpandedCycle(
          expandedCycle === cycle.id ? null : cycle.id
         )}
         variant="outline"
         size="sm"
        >
         {expandedCycle === cycle.id ? 'ซ่อน' : 'ดูรายละเอียด'}
        </Button>
        
        {onExportCycle && (
         <Button
          onClick={() => onExportCycle(cycle.id, cycle.cycle_name)}
          variant="outline"
          size="sm"
         >
          📊 ส่งออก
         </Button>
        )}
        
        {onSelectCycle && (
         <Button
          onClick={() => onSelectCycle(cycle)}
          size="sm"
         >
          เลือก
         </Button>
        )}
       </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
       {cycle.total_employees && (
        <div className="text-center bg-blue-50 rounded-lg p-2">
         <div className="text-lg font-bold text-blue-600">
          {cycle.total_employees}
         </div>
         <div className="text-xs text-blue-800">พนักงาน</div>
        </div>
       )}
       
       {cycle.total_amount && (
        <div className="text-center bg-green-50 rounded-lg p-2">
         <div className="text-lg font-bold text-green-600">
          {formatCurrency(cycle.total_amount)}
         </div>
         <div className="text-xs text-green-800">เงินเดือนรวม</div>
        </div>
       )}
       
       {cycle.total_employees && cycle.total_amount && (
        <div className="text-center bg-purple-50 rounded-lg p-2">
         <div className="text-lg font-bold text-purple-600">
          {formatCurrency(cycle.total_amount / cycle.total_employees)}
         </div>
         <div className="text-xs text-purple-800">เฉลี่ย/คน</div>
        </div>
       )}
       
       <div className="text-center bg-gray-50 rounded-lg p-2">
        <div className="text-lg font-bold text-gray-600">
         {calculateDuration(cycle.start_date, cycle.end_date)}
        </div>
        <div className="text-xs text-gray-800">วัน</div>
       </div>
      </div>

      {/* Expanded Details */}
      {expandedCycle === cycle.id && (
       <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
         <div>
          <h5 className="font-medium text-gray-900 mb-2">ข้อมูลรอบ</h5>
          <div className="space-y-1 text-gray-600">
           <p><span className="font-medium">รหัสรอบ:</span> {cycle.id}</p>
           <p><span className="font-medium">สร้างเมื่อ:</span> {formatDate(cycle.created_at)}</p>
           {cycle.finalized_at && (
            <p><span className="font-medium">ปิดรอบเมื่อ:</span> {formatDate(cycle.finalized_at)}</p>
           )}
          </div>
         </div>
         
         <div>
          <h5 className="font-medium text-gray-900 mb-2">สรุปผลการดำเนินการ</h5>
          <div className="space-y-1 text-gray-600">
           {cycle.status === 'completed' ? (
            <>
             <p>✅ ปิดรอบเรียบร้อยแล้ว</p>
             <p>📊 ข้อมูลถูกบันทึกเป็นประวัติ</p>
             <p>🔒 ไม่สามารถแก้ไขได้</p>
            </>
           ) : (
            <p>🔄 ยังไม่ได้ปิดรอบ</p>
           )}
          </div>
         </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
         <h5 className="font-medium text-gray-900 mb-2">การดำเนินการ</h5>
         <div className="flex flex-wrap gap-2">
          {onExportCycle && (
           <>
            <Button
             onClick={() => onExportCycle(cycle.id, cycle.cycle_name)}
             variant="outline"
             size="sm"
            >
             📥 ส่งออก CSV
            </Button>
            <Button
             onClick={() => onExportCycle(cycle.id, cycle.cycle_name)}
             variant="outline"
             size="sm"
            >
             🔧 ส่งออก JSON
            </Button>
           </>
          )}
          
          <Button
           onClick={() => {
            // Copy cycle ID to clipboard
            navigator.clipboard.writeText(cycle.id)
           }}
           variant="outline"
           size="sm"
          >
           📋 คัดลอก ID
          </Button>
         </div>
        </div>
       </div>
      )}
     </div>
    ))}
   </div>

   {/* Load More Button (if needed) */}
   {cycles.length >= 20 && (
    <div className="mt-6 text-center">
     <Button
      onClick={() => {
       // Could implement pagination here
       console.log('Load more historical cycles')
      }}
      variant="outline"
     >
      โหลดประวัติเพิ่มเติม
     </Button>
    </div>
   )}

   {/* Summary Info */}
   <div className="mt-6 pt-4 border-t border-gray-200">
    <div className="text-sm text-gray-600">
     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
       <span className="font-medium">รอบทั้งหมด:</span>
       <p>{cycles.length} รอบ</p>
      </div>
      <div>
       <span className="font-medium">รอบที่ปิดแล้ว:</span>
       <p>{cycles.filter(c => c.status === 'completed').length} รอบ</p>
      </div>
      <div>
       <span className="font-medium">พนักงานรวม:</span>
       <p>{cycles.reduce((sum, c) => sum + (c.total_employees || 0), 0)} คนครั้ง</p>
      </div>
      <div>
       <span className="font-medium">เงินเดือนรวม:</span>
       <p>{formatCurrency(cycles.reduce((sum, c) => sum + (c.total_amount || 0), 0))}</p>
      </div>
     </div>
    </div>
   </div>
  </Card>
 )
}