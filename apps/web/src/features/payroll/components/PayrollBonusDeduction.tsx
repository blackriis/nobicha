'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, AlertTriangle, CheckCircle } from 'lucide-react'
import { PayrollEmployeeList } from './PayrollEmployeeList'
import { BonusDeductionForm } from './BonusDeductionForm'
import { PayrollAdjustmentPreview } from './PayrollAdjustmentPreview'
import {
 PayrollService,
 type PayrollEmployeeListItem,
 type BonusDeductionData,
 type PayrollAdjustmentPreview as AdjustmentPreviewType
} from '../services/payroll.service'
import type { PayrollCycle } from '@employee-management/database'

interface PayrollBonusDeductionProps {
 cycle: PayrollCycle
 onNavigate?: (view: string, cycle?: PayrollCycle) => void
 onError?: (error: string) => void
 onSuccess?: () => void
}

export function PayrollBonusDeduction({ 
 cycle, 
 onNavigate, 
 onError, 
 onSuccess 
}: PayrollBonusDeductionProps) {
 const [employees, setEmployees] = useState<PayrollEmployeeListItem[]>([])
 const [loading, setLoading] = useState(true)
 const [submitting, setSubmitting] = useState(false)
 const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployeeListItem | null>(null)
 const [formMode, setFormMode] = useState<'bonus' | 'deduction'>('bonus')
 const [showForm, setShowForm] = useState(false)
 const [preview, setPreview] = useState<AdjustmentPreviewType | null>(null)
 const [showPreview, setShowPreview] = useState(false)

 const isReadOnly = cycle.status === 'completed'

 // Load employee data
 useEffect(() => {
  let isMounted = true
  let isLoading = false
  
  if (!cycle?.id) {
   if (isMounted) setLoading(false)
   return
  }
  
  const loadData = async () => {
   if (!isMounted || isLoading) return
   isLoading = true
   await loadEmployees()
   isLoading = false
  }
  
  loadData()
  
  return () => { 
   isMounted = false
   isLoading = false
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [cycle?.id]) // Only re-run when cycle.id changes

 const loadEmployees = async () => {
  try {
   setLoading(true)
   
   console.log('🔍 PayrollBonusDeduction loadEmployees:', {
    cycleId: cycle?.id,
    cycleName: cycle?.cycle_name,
    timestamp: new Date().toISOString()
   })

   // Validate cycle
   if (!cycle?.id) {
    throw new Error('ไม่พบข้อมูลรอบการจ่ายเงินเดือน')
   }

   const response = await PayrollService.getPayrollSummary(cycle.id)
   
   console.log('📊 PayrollService.getPayrollSummary response:', {
    success: response.success,
    error: response.error,
    hasData: !!response.data,
    employeeCount: response.data?.summary?.employee_details?.length || 0
   })
   
   if (response.success && response.data) {
    // Check if employee_details exists and has data
    const employeeDetails = response.data.summary?.employee_details || []
    
    if (employeeDetails.length === 0) {
     console.warn('⚠️  No employee details found in payroll summary')
     onError?.('ไม่พบข้อมูลพนักงานในรอบนี้ กรุณาคำนวณเงินเดือนก่อน')
     return
    }
    
    // Transform the employee_details to match PayrollEmployeeListItem interface
    const employees = employeeDetails.map(emp => ({
     id: emp.id,
     user_id: emp.user_id,
     full_name: emp.employee_name,
     base_pay: emp.base_pay,
     bonus: emp.bonus,
     bonus_reason: emp.bonus_reason,
     deduction: emp.deduction,
     deduction_reason: emp.deduction_reason,
     net_pay: emp.net_pay
    }))
    
    console.log('👥 Setting employees:', employees.length, 'employees')
    setEmployees(employees)
   } else {
    // Handle 404 specifically - PREVENT RETRY LOOPS
    const errorMsg = response.error || 'Failed to fetch payroll details'
    if (errorMsg.includes('ไม่พบรอบ') || errorMsg.includes('not found') || errorMsg.includes('404')) {
     // Don't retry for 404 errors
     console.warn('⚠️  Payroll cycle not found, stopping retries:', cycle.id)
     onError?.('ไม่พบข้อมูลรอบการจ่ายเงินเดือน กรุณาคำนวณเงินเดือนก่อน')
     return
    }
    throw new Error(errorMsg)
   }
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน'
   console.error('PayrollBonusDeduction loadEmployees error:', error)
   onError?.(errorMessage)
  } finally {
   setLoading(false)
  }
 }

 // Handle bonus/deduction operations
 const handleEditBonus = (employee: PayrollEmployeeListItem) => {
  if (isReadOnly) return
  setSelectedEmployee(employee)
  setFormMode('bonus')
  setShowForm(true)
 }

 const handleEditDeduction = (employee: PayrollEmployeeListItem) => {
  if (isReadOnly) return
  setSelectedEmployee(employee)
  setFormMode('deduction')
  setShowForm(true)
 }

 const handleDeleteBonus = async (employee: PayrollEmployeeListItem) => {
  if (isReadOnly) return
  try {
   setSubmitting(true)
   const response = await PayrollService.deleteBonus(employee.id)
   if (!response.success) {
    throw new Error(response.error || 'Failed to delete bonus')
   }
   await loadEmployees()
   onSuccess?.()
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบโบนัส'
   onError?.(errorMessage)
  } finally {
   setSubmitting(false)
  }
 }

 const handleDeleteDeduction = async (employee: PayrollEmployeeListItem) => {
  if (isReadOnly) return
  try {
   setSubmitting(true)
   const response = await PayrollService.deleteDeduction(employee.id)
   if (!response.success) {
    throw new Error(response.error || 'Failed to delete deduction')
   }
   await loadEmployees()
   onSuccess?.()
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบรายการหักเงิน'
   onError?.(errorMessage)
  } finally {
   setSubmitting(false)
  }
 }

 const handleFormSubmit = async (data: BonusDeductionData) => {
  if (!selectedEmployee) return

  try {
   setSubmitting(true)
   
   if (formMode === 'bonus') {
    const response = await PayrollService.updateBonus(selectedEmployee.id, data.bonus || 0, data.bonus_reason)
    if (!response.success) {
     throw new Error(response.error || 'Failed to update bonus')
    }
   } else {
    const response = await PayrollService.updateDeduction(selectedEmployee.id, data.deduction || 0, data.deduction_reason)
    if (!response.success) {
     throw new Error(response.error || 'Failed to update deduction')
    }
   }
   
   setShowForm(false)
   setSelectedEmployee(null)
   await loadEmployees()
   onSuccess?.()
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
   onError?.(errorMessage)
  } finally {
   setSubmitting(false)
  }
 }

 const handleCloseForm = () => {
  setShowForm(false)
  setSelectedEmployee(null)
  setPreview(null)
  setShowPreview(false)
 }

 if (loading) {
  return (
   <Card>
    <CardContent className="pt-6">
     <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span>กำลังโหลดข้อมูลพนักงาน...</span>
     </div>
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
      <Plus className="h-5 w-5" />
      จัดการโบนัสและรายการหักเงิน
     </CardTitle>
     <CardDescription>
      รอบการจ่ายเงินเดือน: {cycle.cycle_name}
      ({new Date(cycle.start_date).toLocaleDateString('th-TH')} - {new Date(cycle.end_date).toLocaleDateString('th-TH')})
     </CardDescription>
    </CardHeader>
   </Card>

   {/* Status Alert */}
   {isReadOnly && (
    <Alert>
     <AlertTriangle className="h-4 w-4" />
     <AlertDescription>
      รอบการจ่ายเงินเดือนนี้ได้ปิดแล้ว ไม่สามารถแก้ไขข้อมูลโบนัสและการหักเงินได้
     </AlertDescription>
    </Alert>
   )}

   {/* Employee List */}
   <Card>
    <CardHeader>
     <CardTitle>รายการพนักงาน</CardTitle>
     <CardDescription>
      คลิกปุ่มเพื่อเพิ่มหรือแก้ไขโบนัสและรายการหักเงินสำหรับพนักงานแต่ละคน
     </CardDescription>
    </CardHeader>
    <CardContent>
     <PayrollEmployeeList
      employees={employees}
      isLoading={submitting}
      onEditBonus={handleEditBonus}
      onEditDeduction={handleEditDeduction}
      onDeleteBonus={handleDeleteBonus}
      onDeleteDeduction={handleDeleteDeduction}
      cycleStatus={cycle.status}
     />
    </CardContent>
   </Card>

   {/* Bonus/Deduction Form Dialog */}
   <BonusDeductionForm
    isOpen={showForm}
    onClose={handleCloseForm}
    employee={selectedEmployee}
    mode={formMode}
    onSubmit={handleFormSubmit}
    isLoading={submitting}
   />

   {/* Adjustment Preview */}
   {showPreview && preview && (
    <PayrollAdjustmentPreview
     preview={preview}
     onConfirm={() => {
      // Handle confirmation if needed
      setShowPreview(false)
     }}
     onCancel={() => {
      setShowPreview(false)
      setPreview(null)
     }}
     isLoading={submitting}
    />
   )}

   {/* Navigation */}
   <div className="flex justify-between">
    <Button 
     variant="outline" 
     onClick={() => onNavigate?.('summary', cycle)}
    >
     ไปยังสรุปการจ่าย
    </Button>
    <Button 
     onClick={() => onNavigate?.('export', cycle)}
     disabled={isReadOnly}
    >
     ส่งออกรายงาน
    </Button>
   </div>
  </div>
 )
}