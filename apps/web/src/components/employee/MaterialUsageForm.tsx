'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { StandardErrorDisplay, StandardLoadingState, StandardStatusAlert, StandardCard } from './ui-standards'
import { 
 materialUsageService,
 type MaterialUsageRecord,
 type MaterialUsageItem,
 type CurrentSessionData 
} from '@/lib/services/material-usage.service'
import { type RawMaterial } from '@/lib/services/raw-materials.service'
import { validateMaterialUsageItems } from '@/lib/utils/material-usage.utils'
import { MaterialSelector } from './MaterialSelector'
import { UsageSummary } from './UsageSummary'
import { SubmissionConfirmation } from './SubmissionConfirmation'
import { Package, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SelectedMaterial extends MaterialUsageItem {
 material_info?: RawMaterial
}

function getErrorMessage(error: unknown, defaultMsg: string) {
 if (error instanceof Error) {
  return error.message
 }
 return defaultMsg
}

function mapRecordsToSelectedMaterials(records: MaterialUsageRecord[]): SelectedMaterial[] {
 return records.map(record => ({
  material_id: record.material_id,
  quantity_used: record.quantity_used,
  material_info: {
   id: record.raw_materials.id,
   name: record.raw_materials.name,
   unit: record.raw_materials.unit,
   cost_per_unit: record.raw_materials.cost_per_unit || 0,
   created_at: ''
  }
 }))
}

export function MaterialUsageForm() {
 // State for current session
 const [sessionData, setSessionData] = useState<CurrentSessionData | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 // State for form
 const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([])
 const [submitting, setSubmitting] = useState(false)
 const [validationErrors, setValidationErrors] = useState<string[]>([])

 // State for confirmation dialog
 const [showConfirmation, setShowConfirmation] = useState(false)
 const [submissionSuccess, setSubmissionSuccess] = useState(false)
 const [submittedRecords, setSubmittedRecords] = useState<MaterialUsageRecord[]>([])

 // Load current session data
 const loadCurrentSession = useCallback(async () => {
  try {
   setLoading(true)
   setError(null)

   const result = await materialUsageService.getCurrentSessionUsage()

   if (!result.success) {
    throw new Error(result.error || 'ไม่สามารถดึงข้อมูลเซสชันปัจจุบันได้')
   }

   setSessionData(result.data || null)
   
   // If user already has material usage records, show them as read-only
   if (result.data?.records && result.data.records.length > 0) {
    setSelectedMaterials(mapRecordsToSelectedMaterials(result.data.records))
   } else {
    setSelectedMaterials([])
   }

  } catch (error) {
   // Log for debugging (always log session loading errors as they're critical)
   console.error('Error loading session:', error)
   const errorMessage = getErrorMessage(error, 'เกิดข้อผิดพลาดในการดึงข้อมูล')
   setError(errorMessage)
   
   // Show user-friendly error toast
   toast.error(`ไม่สามารถโหลดข้อมูลเซสชันได้: ${errorMessage}`)
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  loadCurrentSession()
 }, [loadCurrentSession])

 const handleMaterialsChange = (materials: SelectedMaterial[]) => {
  setSelectedMaterials(materials)
  
  // Validate materials
  const materialItems = materials.map(m => ({
   material_id: m.material_id,
   quantity_used: m.quantity_used
  }))
  
  const validation = validateMaterialUsageItems(materialItems)
  setValidationErrors(validation.errors)
 }

 const handleSubmit = () => {
  // Reuse validation logic from handleMaterialsChange
  const materialItems = selectedMaterials.map(m => ({
   material_id: m.material_id,
   quantity_used: m.quantity_used
  }))

  const validation = validateMaterialUsageItems(materialItems)

  if (!validation.isValid) {
   setValidationErrors(validation.errors)
   toast.error('กรุณาแก้ไขข้อผิดพลาดก่อนบันทึก')
   return
  }

  setValidationErrors([])
  setShowConfirmation(true)
 }

 const handleConfirmSubmission = async () => {
  try {
   setSubmitting(true)

   const materialItems = selectedMaterials.map(m => ({
    material_id: m.material_id,
    quantity_used: m.quantity_used
   }))

   const result = await materialUsageService.submitMaterialUsage({
    materials: materialItems
   })

   if (!result.success) {
    // Handle error from service without throwing
    const errorMessage = result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    
    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
     console.warn('Material usage submission failed:', errorMessage)
    }
    
    toast.error(errorMessage)
    setShowConfirmation(false)
    return
   }

   // Success
   setSubmittedRecords(() => result.data?.records || [])
   setSubmissionSuccess(true)
   toast.success('บันทึกการใช้วัตถุดิบสำเร็จ')

   // Reload session data
   await loadCurrentSession()

  } catch (error) {
   // Handle unexpected errors - always log these as they indicate bugs
   console.error('Unexpected error submitting usage:', error)
   const errorMessage = getErrorMessage(error, 'เกิดข้อผิดพลาดที่ไม่คาดคิด')
   toast.error(`ข้อผิดพลาดในการบันทึก: ${errorMessage}`)
   setShowConfirmation(false)
  } finally {
   setSubmitting(false)
  }
 }

 const handleCloseConfirmation = () => {
  setShowConfirmation(false)
  setSubmissionSuccess(false)
  setSubmittedRecords([])
 }

 if (loading) {
  return <StandardLoadingState message="กำลังโหลดข้อมูลเซสชัน..." />
 }

 if (error) {
  return <StandardErrorDisplay error={error} onRetry={loadCurrentSession} />
 }

 if (!sessionData?.has_active_session) {
  return (
   <StandardStatusAlert type="warning" title="ไม่พบการเช็คอิน">
    {sessionData?.message || 'กรุณาเช็คอินก่อนรายงานการใช้วัตถุดิบ'}
   </StandardStatusAlert>
  )
 }

 const hasExistingRecords = sessionData.records && sessionData.records.length > 0
 const canAddMaterials = sessionData.can_add_materials !== false
 const hasValidMaterials = selectedMaterials.some(m => m.quantity_used > 0)

 return (
  <div className="space-y-6">
   {/* Session Status */}
   <StandardStatusAlert type="success" title="เซสชันการทำงานปัจจุบัน">
    คุณสามารถรายงานการใช้วัตถุดิบได้
   </StandardStatusAlert>

   {/* Existing Records (if any) */}
   {hasExistingRecords && (
    <StandardCard 
     title="การใช้วัตถุดิบที่บันทึกไว้แล้ว" 
     icon={<Package className="h-5 w-5" />}
    >
     <UsageSummary records={sessionData.records || []} showTotal={true} />
    </StandardCard>
   )}

   {/* Material Selection (only if can add materials) */}
   {canAddMaterials && (
    <StandardCard 
     title={hasExistingRecords ? 'เพิ่มวัตถุดิบเพิ่มเติม' : 'รายงานการใช้วัตถุดิบ'}
     icon={<Package className="h-5 w-5" />}
    >
     {/* Validation Errors */}
     {validationErrors.length > 0 && (
      <StandardStatusAlert type="error" title="กรุณาแก้ไขข้อผิดพลาด:">
       <ul className="list-disc list-inside text-sm space-y-1">
        {validationErrors.map((error, index) => (
         <li key={index}>{error}</li>
        ))}
       </ul>
      </StandardStatusAlert>
     )}

     <MaterialSelector
      selectedMaterials={selectedMaterials}
      onMaterialsChange={handleMaterialsChange}
      disabled={submitting}
     />

     {/* Submit Button */}
     {hasValidMaterials && (
      <div className="flex justify-end pt-4 border-t border-border">
       <Button
        onClick={handleSubmit}
        disabled={submitting || validationErrors.length > 0}
        className="min-w-[150px]"
       >
        {submitting ? (
         <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          กำลังบันทึก...
         </>
        ) : (
         <>
          <Save className="h-4 w-4 mr-2" />
          บันทึกการใช้วัตถุดิบ
         </>
        )}
       </Button>
      </div>
     )}
    </StandardCard>
   )}

   {/* Read-only message */}
   {!canAddMaterials && (
    <StandardStatusAlert type="warning" title="การรายงานถูกปิดใช้งาน">
     ไม่สามารถเพิ่มหรือแก้ไขการใช้วัตถุดิบในเซสชันปัจจุบันได้
    </StandardStatusAlert>
   )}

   {/* Confirmation Dialog */}
   <SubmissionConfirmation
    isOpen={showConfirmation}
    onClose={handleCloseConfirmation}
    onConfirm={handleConfirmSubmission}
    materials={selectedMaterials.map(m => ({
     material_id: m.material_id,
     quantity_used: m.quantity_used,
     material_info: m.material_info ? {
      id: m.material_info.id,
      name: m.material_info.name,
      unit: m.material_info.unit,
      cost_per_unit: m.material_info.cost_per_unit || 0
     } : undefined
    }))}
    loading={submitting}
    success={submissionSuccess}
    submittedRecords={submittedRecords}
   />
  </div>
 )
}