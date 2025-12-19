'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
 FileText, 
 Users, 
 DollarSign, 
 AlertTriangle, 
 CheckCircle2, 
 Download,
 Lock,
 Eye
} from 'lucide-react'
import { PayrollService, type PayrollSummaryResponse } from '../services/payroll.service'
import type { PayrollCycle } from '@employee-management/database'

type PayrollView = 'dashboard' | 'calculation' | 'summary' | 'bonus-deduction' | 'export' | 'history'

interface PayrollSummaryProps {
 cycle: PayrollCycle
 onNavigate: (view: PayrollView, cycle?: PayrollCycle) => void
 onError: (error: string) => void
 onSuccess: () => void
}

export function PayrollSummary({ cycle, onNavigate, onError, onSuccess }: PayrollSummaryProps) {
 const [summary, setSummary] = useState<PayrollSummaryResponse['summary'] | null>(null)
 const [loading, setLoading] = useState(true)
 const [finalizing, setFinalizing] = useState(false)

 useEffect(() => {
  // Validate cycle before loading
  if (!cycle?.id) {
   onError('ข้อมูลรอบการจ่ายเงินเดือนไม่ถูกต้อง')
   setLoading(false)
   return
  }
  loadSummary()
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [cycle?.id]) // Only re-run when cycle.id changes

 const loadSummary = async () => {
  try {
   setLoading(true)

   // Additional validation
   if (!cycle?.id) {
    throw new Error('ไม่พบข้อมูลรอบการจ่ายเงินเดือน กรุณาเลือกรอบใหม่')
   }

   const result = await PayrollService.getPayrollSummary(cycle.id)

   if (result.success) {
    setSummary(result.data.summary)
   } else {
    // Provide more specific error message
    const errorMessage = result.error || 'เกิดข้อผิดพลาดในการโหลดสรุปการจ่ายเงินเดือน'

    // Check if it's a 404 error (cycle not found) - PREVENT RETRY LOOPS
    if (errorMessage.includes('ไม่พบรอบ') || errorMessage.includes('not found') || errorMessage.includes('404')) {
     console.warn('⚠️  Payroll cycle not found, stopping retries:', cycle.id)
     onError('ไม่พบรอบการจ่ายเงินเดือนที่ระบุ กรุณาตรวจสอบว่ามีการคำนวณเงินเดือนแล้ว')
     return // Don't retry for 404 errors
    } else {
     onError(errorMessage)
    }
   }
  } catch (error) {
   console.error('Error loading summary:', error)
   const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดสรุปการจ่ายเงินเดือน'
   onError(errorMessage)
  } finally {
   setLoading(false)
  }
 }

 const handleFinalize = async () => {
  if (!summary?.validation.can_finalize) {
   onError('ไม่สามารถปิดรอบได้ กรุณาแก้ไขปัญหาที่พบก่อน')
   return
  }

  try {
   setFinalizing(true)
   const result = await PayrollService.finalizePayrollCycle(cycle.id)
   
   if (result.success) {
    onSuccess()
    onNavigate('dashboard')
   } else {
    onError('เกิดข้อผิดพลาดในการปิดรอบการจ่ายเงินเดือน')
   }
  } catch (error) {
   console.error('Error finalizing:', error)
   onError('เกิดข้อผิดพลาดในการปิดรอบการจ่ายเงินเดือน')
  } finally {
   setFinalizing(false)
  }
 }

 const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
   style: 'currency',
   currency: 'THB',
   minimumFractionDigits: 0,
   maximumFractionDigits: 0,
  }).format(amount)
 }

 if (loading) {
  return (
   <div className="space-y-6">
    <Card>
     <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
     </CardHeader>
     <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
         <Skeleton className="h-4 w-20" />
         <Skeleton className="h-8 w-24" />
        </div>
       ))}
      </div>
     </CardContent>
    </Card>
   </div>
  )
 }

 if (!summary) {
  return (
   <Card>
    <CardContent className="pt-6">
     <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-2">
       <p className="font-medium">ไม่พบข้อมูลสรุปการจ่ายเงินเดือน</p>
       <p className="text-sm">กรุณาดำเนินการคำนวณเงินเดือนสำหรับรอบนี้ก่อน จึงจะสามารถดูสรุปและปิดรอบได้</p>
       <div className="pt-2">
        <Button
         variant="outline"
         onClick={() => onNavigate('calculation', cycle)}
        >
         ไปหน้าคำนวณเงินเดือน
        </Button>
       </div>
      </AlertDescription>
     </Alert>
    </CardContent>
   </Card>
  )
 }

 return (
  <div className="space-y-6">
   {/* Header */}
   <Card>
    <CardHeader>
     <CardTitle className="flex items-center gap-2">
      <FileText className="h-5 w-5" />
      สรุปการจ่ายเงินเดือน
     </CardTitle>
     <CardDescription>
      รอบ: {summary.cycle_info.name}
     </CardDescription>
    </CardHeader>
   </Card>

   {/* Summary Cards */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <Card>
     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">จำนวนพนักงาน</CardTitle>
      <Users className="h-4 w-4 text-muted-foreground" />
     </CardHeader>
     <CardContent>
      <div className="text-2xl font-bold">{summary.totals.total_employees}</div>
      <p className="text-xs text-muted-foreground">คน</p>
     </CardContent>
    </Card>

    <Card>
     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">เงินเดือนสุทธิ</CardTitle>
      <DollarSign className="h-4 w-4 text-muted-foreground" />
     </CardHeader>
     <CardContent>
      <div className="text-2xl font-bold text-green-600">
       {formatCurrency(summary.totals.total_net_pay)}
      </div>
      <p className="text-xs text-muted-foreground">ยอดรวมที่จ่าย</p>
     </CardContent>
    </Card>

    <Card>
     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">โบนัสรวม</CardTitle>
      <DollarSign className="h-4 w-4 text-muted-foreground" />
     </CardHeader>
     <CardContent>
      <div className="text-2xl font-bold text-blue-600">
       {formatCurrency(summary.totals.total_bonus)}
      </div>
      <p className="text-xs text-muted-foreground">เงินเพิ่มพิเศษ</p>
     </CardContent>
    </Card>

    <Card>
     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">หักเงินรวม</CardTitle>
      <DollarSign className="h-4 w-4 text-muted-foreground" />
     </CardHeader>
     <CardContent>
      <div className="text-2xl font-bold text-red-600">
       {formatCurrency(summary.totals.total_deduction)}
      </div>
      <p className="text-xs text-muted-foreground">ยอดที่หักออก</p>
     </CardContent>
    </Card>
   </div>

   {/* Actions */}
   <Card>
    <CardHeader>
     <CardTitle>การดำเนินการ</CardTitle>
     <CardDescription>
      เลือกการดำเนินการที่ต้องการทำ
     </CardDescription>
    </CardHeader>
    <CardContent>
     <div className="flex flex-col sm:flex-row gap-3">
      <Button 
       onClick={() => onNavigate('bonus-deduction', cycle)}
       variant="outline"
       className="flex-1"
      >
       <Eye className="h-4 w-4 mr-2" />
       แก้ไขโบนัส/หักเงิน
      </Button>
      
      <Button 
       onClick={() => onNavigate('export', cycle)}
       variant="outline"
       className="flex-1"
      >
       <Download className="h-4 w-4 mr-2" />
       ส่งออกรายงาน
      </Button>
      
      <Button 
       onClick={handleFinalize}
       disabled={finalizing}
       className="flex-1"
      >
       <Lock className="h-4 w-4 mr-2" />
       {finalizing ? 'กำลังปิดรอบ...' : 'ปิดรอบการจ่าย'}
      </Button>
     </div>
    </CardContent>
   </Card>
  </div>
 )
}