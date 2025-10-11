'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { PayrollEmployeeListItem, BonusDeductionData } from '../services/payroll.service'
import { PayrollDetailUtils } from '../utils/payroll-detail.utils'

interface BonusDeductionFormProps {
 isOpen: boolean
 onClose: () => void
 employee: PayrollEmployeeListItem | null
 mode: 'bonus' | 'deduction'
 onSubmit: (data: BonusDeductionData) => Promise<void>
 isLoading?: boolean
}

export const BonusDeductionForm: React.FC<BonusDeductionFormProps> = ({
 isOpen,
 onClose,
 employee,
 mode,
 onSubmit,
 isLoading = false,
}) => {
 const [amount, setAmount] = useState<string>('')
 const [reason, setReason] = useState<string>('')
 const [errors, setErrors] = useState<string[]>([])
 const [isSubmitting, setIsSubmitting] = useState(false)

 const isBonus = mode === 'bonus'
 const currentAmount = employee ? (isBonus ? employee.bonus : employee.deduction) : 0
 const currentReason = employee ? (isBonus ? employee.bonus_reason : employee.deduction_reason) : ''

 useEffect(() => {
  if (employee && isOpen) {
   setAmount(currentAmount > 0 ? currentAmount.toString() : '')
   setReason(currentReason || '')
   setErrors([])
  }
 }, [employee, isOpen, currentAmount, currentReason])

 const handleAmountChange = (value: string) => {
  // อนุญาตเฉพาะตัวเลขและจุดทศนิยม
  const sanitized = value.replace(/[^0-9.]/g, '')
  
  // ป้องกันจุดทศนิยมหลายจุด
  const parts = sanitized.split('.')
  if (parts.length > 2) {
   return
  }
  
  // จำกัดทศนิยม 2 ตำแหน่ง
  if (parts[1] && parts[1].length > 2) {
   return
  }
  
  setAmount(sanitized)
  setErrors([])
 }

 const validateForm = (): boolean => {
  const newErrors: string[] = []
  
  // Validate amount
  const numAmount = parseFloat(amount || '0')
  if (isNaN(numAmount) || numAmount < 0) {
   newErrors.push(`จำนวน${isBonus ? 'โบนัส' : 'หักเงิน'}ต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0`)
  }

  // Validate reason if amount > 0
  if (numAmount > 0) {
   const reasonValidation = PayrollDetailUtils.validateThaiInput(reason)
   if (!reasonValidation.isValid) {
    newErrors.push(...reasonValidation.errors)
   }
  }

  // ตรวจสอบว่าเงินเดือนสุทธิจะเป็นลบหรือไม่
  if (employee && numAmount >= 0) {
   const newBonus = isBonus ? numAmount : employee.bonus
   const newDeduction = isBonus ? employee.deduction : numAmount
   
   if (PayrollDetailUtils.isNetPayNegative(
    employee.base_pay, 0, newBonus, newDeduction
   )) {
    newErrors.push('การเปลี่ยนแปลงนี้จะทำให้เงินเดือนสุทธิติดลบ')
   }
  }

  setErrors(newErrors)
  return newErrors.length === 0
 }

 const handleSubmit = async () => {
  if (!employee || !validateForm()) {
   return
  }

  setIsSubmitting(true)
  try {
   const numAmount = parseFloat(amount || '0')
   const data: BonusDeductionData = {}
   
   if (isBonus) {
    data.bonus = numAmount
    data.bonus_reason = numAmount > 0 ? reason.trim() : undefined
   } else {
    data.deduction = numAmount
    data.deduction_reason = numAmount > 0 ? reason.trim() : undefined
   }

   await onSubmit(data)
   onClose()
  } catch (error) {
   console.error('Error submitting form:', error)
   setErrors(['เกิดข้อผิดพลาดในการบันทึกข้อมูล'])
  } finally {
   setIsSubmitting(false)
  }
 }

 const calculatePreviewNetPay = (): number => {
  if (!employee) return 0
  
  const numAmount = parseFloat(amount || '0')
  const newBonus = isBonus ? numAmount : employee.bonus
  const newDeduction = isBonus ? employee.deduction : numAmount
  
  return employee.base_pay + newBonus - newDeduction
 }

 const previewNetPay = calculatePreviewNetPay()
 const netPayChange = employee ? previewNetPay - employee.net_pay : 0

 if (!employee) return null

 return (
  <Dialog open={isOpen} onOpenChange={onClose}>
   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle className="text-lg font-semibold">
      {isBonus ? 'จัดการโบนัส' : 'จัดการการหักเงิน'}
     </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
     {/* ข้อมูลพนักงาน */}
     <Card className="p-3 bg-gray-50">
      <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
      <div className="text-xs text-gray-600 mt-1">
       เงินเดือนพื้นฐาน: {PayrollDetailUtils.formatCurrency(employee.base_pay)}
      </div>
      <div className="text-xs text-gray-600">
       เงินเดือนสุทธิปัจจุบัน: {PayrollDetailUtils.formatCurrency(employee.net_pay)}
      </div>
     </Card>

     {/* จำนวนเงิน */}
     <div className="space-y-2">
      <Label htmlFor="amount" className="text-sm font-medium">
       จำนวน{isBonus ? 'โบนัส' : 'หักเงิน'} (บาท) *
      </Label>
      <Input
       id="amount"
       type="text"
       inputMode="decimal"
       placeholder="0.00"
       value={amount}
       onChange={(e) => handleAmountChange(e.target.value)}
       className={errors.some(e => e.includes('จำนวน')) ? 'border-red-500' : ''}
      />
     </div>

     {/* เหตุผล */}
     <div className="space-y-2">
      <Label htmlFor="reason" className="text-sm font-medium">
       เหตุผล {parseFloat(amount || '0') > 0 && '*'}
      </Label>
      <Textarea
       id="reason"
       className={`resize-none ${
        errors.some(e => e.includes('เหตุผล')) ? 'border-destructive' : ''
       }`}
       placeholder={`กรุณาระบุเหตุผลใน${isBonus ? 'การให้โบนัส' : 'การหักเงิน'} (ถ้ามี)`}
       rows={3}
       value={reason}
       onChange={(e) => setReason(e.target.value)}
       maxLength={500}
      />
      <div className="text-xs text-gray-500 text-right">
       {reason.length}/500 ตัวอักษร
      </div>
     </div>

     {/* Error messages */}
     {errors.length > 0 && (
      <div className="bg-red-50 border border-red-200 rounded-md p-3">
       <div className="text-sm text-red-600">
        <ul className="list-disc list-inside space-y-1">
         {errors.map((error, index) => (
          <li key={index}>{error}</li>
         ))}
        </ul>
       </div>
      </div>
     )}

     {/* Preview */}
     {parseFloat(amount || '0') >= 0 && (
      <Card className="p-3 bg-blue-50 border-blue-200">
       <div className="text-sm font-medium text-blue-900 mb-2">ตัวอย่างผลลัพธ์</div>
       <div className="space-y-1 text-xs">
        <div className="flex justify-between">
         <span className="text-gray-600">เงินเดือนพื้นฐาน:</span>
         <span>{PayrollDetailUtils.formatCurrency(employee.base_pay)}</span>
        </div>
        <div className="flex justify-between">
         <span className="text-gray-600">โบนัสใหม่:</span>
         <span className="text-green-600">
          {PayrollDetailUtils.formatCurrency(
           isBonus ? parseFloat(amount || '0') : employee.bonus
          )}
         </span>
        </div>
        <div className="flex justify-between">
         <span className="text-gray-600">หักเงินใหม่:</span>
         <span className="text-red-600">
          -{PayrollDetailUtils.formatCurrency(
           isBonus ? employee.deduction : parseFloat(amount || '0')
          )}
         </span>
        </div>
        <hr className="border-blue-300" />
        <div className="flex justify-between font-medium">
         <span>เงินเดือนสุทธิใหม่:</span>
         <span className={previewNetPay < 0 ? 'text-red-600' : 'text-blue-600'}>
          {PayrollDetailUtils.formatCurrency(previewNetPay)}
         </span>
        </div>
        {netPayChange !== 0 && (
         <div className="flex justify-between text-xs">
          <span>การเปลี่ยนแปลง:</span>
          <span className={netPayChange > 0 ? 'text-green-600' : 'text-red-600'}>
           {netPayChange > 0 ? '+' : ''}{PayrollDetailUtils.formatCurrency(netPayChange)}
          </span>
         </div>
        )}
       </div>
      </Card>
     )}
    </div>

    {/* Actions */}
    <div className="flex space-x-2 pt-4">
     <Button
      variant="outline"
      onClick={onClose}
      disabled={isSubmitting}
      className="flex-1"
     >
      ยกเลิก
     </Button>
     <Button
      onClick={handleSubmit}
      disabled={isSubmitting || errors.length > 0}
      className="flex-1"
     >
      {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 )
}