'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
 SalesReportsService,
 type SalesReportData,
 type SalesReportSubmission 
} from '@/lib/services/sales-reports.service'
import { 
 validateSalesAmount,
 formatSalesAmountForInput,
 parseSalesAmount,
 formatThaiCurrency 
} from '@/lib/utils/sales-reports.utils'
import { SlipImageUpload } from './SlipImageUpload'
import { SubmissionResult } from './SubmissionResult'
import { Calculator, Send, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface DailySalesFormProps {
 branchName: string
 onSubmissionSuccess?: (data: SalesReportSubmission['data']) => void
 disabled?: boolean
}

export function DailySalesForm({ 
 branchName, 
 onSubmissionSuccess,
 disabled = false 
}: DailySalesFormProps) {
 // Form state
 const [totalSalesInput, setTotalSalesInput] = useState('')
 const [slipImage, setSlipImage] = useState<File | null>(null)
 const [submitting, setSubmitting] = useState(false)
 const [validationErrors, setValidationErrors] = useState<string[]>([])

 // Submission confirmation state
 const [showConfirmation, setShowConfirmation] = useState(false)
 const [submissionSuccess, setSubmissionSuccess] = useState(false)
 const [submittedData, setSubmittedData] = useState<SalesReportSubmission['data'] | null>(null)

 // Handle sales amount input with formatting
 const handleSalesAmountChange = useCallback((value: string) => {
  const formatted = formatSalesAmountForInput(value)
  setTotalSalesInput(formatted)
  
  // Clear validation errors when user types
  if (validationErrors.length > 0) {
   setValidationErrors([])
  }
 }, [validationErrors.length])

 // Handle slip image selection
 const handleSlipImageChange = useCallback((file: File | null) => {
  setSlipImage(file)
  
  // Clear validation errors when user selects image
  if (validationErrors.length > 0) {
   setValidationErrors([])
  }
 }, [validationErrors.length])

 // Validate form before submission
 const validateForm = (): boolean => {
  const errors: string[] = []

  // Validate sales amount
  const amountValidation = validateSalesAmount(totalSalesInput)
  if (!amountValidation.valid) {
   errors.push(...amountValidation.errors)
  }

  // Validate slip image
  if (!slipImage) {
   errors.push('กรุณาแนบรูปภาพสลิปยืนยันยอดขาย')
  }

  setValidationErrors(errors)
  return errors.length === 0
 }

 // Handle form submission
 const handleSubmit = async () => {
  if (!validateForm()) {
   toast.error('กรุณาตรวจสอบข้อมูลที่กรอก')
   return
  }

  try {
   setSubmitting(true)
   setValidationErrors([])

   const salesAmount = parseSalesAmount(totalSalesInput)
   const reportData: SalesReportData = {
    totalSales: salesAmount,
    slipImage: slipImage!
   }

   const result = await SalesReportsService.submitReport(reportData)

   if (result.success && result.data) {
    setSubmittedData(result.data)
    setSubmissionSuccess(true)
    setShowConfirmation(true)
    
    toast.success(result.message || 'บันทึกรายงานยอดขายสำเร็จ')
    
    // Reset form
    setTotalSalesInput('')
    setSlipImage(null)
    
    // Callback to parent component
    if (onSubmissionSuccess) {
     onSubmissionSuccess(result.data)
    }
   } else {
    setSubmissionSuccess(false)
    toast.error(result.error || 'เกิดข้อผิดพลาดในการส่งรายงาน')
   }
  } catch (error) {
   console.error('Submit sales report error:', error)
   setSubmissionSuccess(false)
   toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
  } finally {
   setSubmitting(false)
  }
 }

 // Calculate total sales for preview
 const totalSalesAmount = parseSalesAmount(totalSalesInput)

 if (showConfirmation) {
  return (
   <SubmissionResult
    success={submissionSuccess}
    title={submissionSuccess ? 'บันทึกรายงานยอดขายสำเร็จ' : 'เกิดข้อผิดพลาด'}
    message={
     submissionSuccess 
      ? `บันทึกยอดขายสาขา${branchName} เรียบร้อยแล้ว`
      : 'ไม่สามารถบันทึกรายงานได้ กรุณาลองใหม่อีกครั้ง'
    }
    details={submittedData ? [
     `สาขา: ${submittedData.branches.name}`,
     `ยอดขาย: ${formatThaiCurrency(submittedData.total_sales)}`,
     `วันที่รายงาน: ${new Date(submittedData.report_date).toLocaleDateString('th-TH')}`
    ] : undefined}
    onClose={() => {
     setShowConfirmation(false)
     setSubmittedData(null)
    }}
   />
  )
 }

 return (
  <Card className="w-full max-w-2xl mx-auto">
   <CardHeader className="pb-4">
    <div className="flex items-center gap-2">
     <Calculator className="h-5 w-5 text-blue-600" />
     <CardTitle className="text-lg font-medium">
      รายงานยอดขายรายวัน - สาขา{branchName}
     </CardTitle>
    </div>
    <p className="text-sm text-gray-600 mt-1">
     กรุณากรอกยอดขายรวมของสาขาและแนบรูปภาพสลิปยืนยัน
    </p>
   </CardHeader>

   <CardContent className="space-y-6">
    {/* Validation Errors */}
    {validationErrors.length > 0 && (
     <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
       <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
       <div className="flex-1">
        <p className="text-sm font-medium text-red-800 mb-1">
         กรุณาแก้ไขข้อมูลต่อไปนี้:
        </p>
        <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
         {validationErrors.map((error, index) => (
          <li key={index}>{error}</li>
         ))}
        </ul>
       </div>
      </div>
     </div>
    )}

    {/* Sales Amount Input */}
    <div className="space-y-2">
     <Label htmlFor="totalSales" className="text-sm font-medium">
      ยอดขายรวม (บาท) *
     </Label>
     <Input
      id="totalSales"
      type="text"
      placeholder="0.00"
      value={totalSalesInput}
      onChange={(e) => handleSalesAmountChange(e.target.value)}
      disabled={disabled || submitting}
      className="text-lg font-medium text-right"
      autoComplete="off"
     />
     {totalSalesAmount > 0 && (
      <p className="text-sm text-gray-600">
       ยอดขาย: {formatThaiCurrency(totalSalesAmount)}
      </p>
     )}
    </div>

    {/* Slip Image Upload */}
    <div className="space-y-2">
     <Label className="text-sm font-medium">
      รูปภาพสลิปยืนยันยอดขาย *
     </Label>
     <SlipImageUpload
      onImageSelect={handleSlipImageChange}
      disabled={disabled || submitting}
     />
    </div>

    {/* Current Date Info */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
     <p className="text-sm text-blue-800">
      <span className="font-medium">วันที่รายงาน:</span>{' '}
      {new Date().toLocaleDateString('th-TH', {
       year: 'numeric',
       month: 'long',
       day: 'numeric'
      })}
     </p>
    </div>

    {/* Submit Button */}
    <Button
     onClick={handleSubmit}
     disabled={disabled || submitting || !totalSalesInput || !slipImage}
     className="w-full"
     size="lg"
    >
     {submitting ? (
      <>
       <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
       กำลังบันทึก...
      </>
     ) : (
      <>
       <Send className="h-4 w-4 mr-2" />
       บันทึกรายงานยอดขาย
      </>
     )}
    </Button>

    {disabled && (
     <p className="text-center text-sm text-amber-600 bg-amber-50 py-2 px-4 rounded-lg">
      คุณได้ทำการรายงานยอดขายของวันนี้แล้ว
     </p>
    )}
   </CardContent>
  </Card>
 )
}