'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  type MaterialUsageRecord 
} from '@/lib/services/material-usage.service'
import { 
  formatQuantity,
  formatMaterialName,
  formatUnit
} from '@/lib/utils/material-usage.utils'
import { CheckCircle2, AlertTriangle, Package } from 'lucide-react'
import { UsageSummary } from './UsageSummary'

interface SubmissionConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  materials: Array<{
    material_id: string
    quantity_used: number
    material_info?: {
      id: string
      name: string
      unit: string
      cost_per_unit: number
    }
  }>
  loading?: boolean
  success?: boolean
  submittedRecords?: MaterialUsageRecord[]
}

export function SubmissionConfirmation({
  isOpen,
  onClose,
  onConfirm,
  materials,
  loading = false,
  success = false,
  submittedRecords
}: SubmissionConfirmationProps) {

  const validMaterials = materials.filter(m => 
    m.material_info && m.quantity_used > 0
  )

  if (success && submittedRecords) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              บันทึกการใช้วัตถุดิบสำเร็จ
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/50 dark:border-green-500/30">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">บันทึกข้อมูลเรียบร้อยแล้ว</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                ระบบได้บันทึกการใช้วัตถุดิบของคุณเรียบร้อยแล้ว 
                ข้อมูลจะถูกนำไปคำนวณต้นทุนสำหรับรอบการทำงานปัจจุบัน
              </p>
            </div>

            <UsageSummary records={submittedRecords} showTotal={true} />
          </div>

          <DialogFooter>
            <Button onClick={onClose} className="w-full">
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            ยืนยันการบันทึกการใช้วัตถุดิบ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/50 dark:border-amber-500/30">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">กรุณาตรวจสอบข้อมูลให้ครบถ้วน</div>
                <p className="text-sm">
                  หลังจากบันทึกแล้ว จะไม่สามารถแก้ไขข้อมูลการใช้วัตถุดิบในรอบการทำงานปัจจุบันได้
                </p>
              </div>
            </div>
          </div>

          {/* Materials Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายการวัตถุดิบที่จะบันทึก</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validMaterials.map((material) => (
                  <div
                    key={material.material_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {material.material_info ? 
                          formatMaterialName(material.material_info.name) : 
                          'ไม่พบข้อมูลวัตถุดิบ'
                        }
                      </div>
                      {material.material_info && (
                        <div className="text-sm text-gray-500">
                          หน่วย: {formatUnit(material.material_info.unit)}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">
                        {material.material_info ? 
                          formatQuantity(material.quantity_used, material.material_info.unit) :
                          material.quantity_used.toString()
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || validMaterials.length === 0}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                กำลังบันทึก...
              </>
            ) : (
              'ยืนยันบันทึก'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}