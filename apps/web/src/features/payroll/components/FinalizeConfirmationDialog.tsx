'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { PayrollService, type PayrollSummaryResponse, type PayrollFinalizationResponse } from '../services/payroll.service'

interface FinalizeConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  cycleId: string
  summary: PayrollSummaryResponse['summary']
  onFinalized?: (result: PayrollFinalizationResponse) => void
}

export default function FinalizeConfirmationDialog({ 
  isOpen, 
  onClose, 
  cycleId, 
  summary,
  onFinalized
}: FinalizeConfirmationDialogProps) {
  const [finalizing, setFinalizing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount)
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

  const handleFinalize = async () => {
    if (!confirmed) {
      setError('กรุณายืนยันการปิดรอบก่อนดำเนินการ')
      return
    }

    setFinalizing(true)
    setError(null)

    try {
      const result = await PayrollService.finalizePayrollCycle(cycleId)
      
      if (result.success) {
        onFinalized?.(result.data)
        onClose()
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการปิดรอบการจ่ายเงินเดือน')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด')
      console.error('Finalize error:', err)
    } finally {
      setFinalizing(false)
    }
  }

  const finalizationCheck = PayrollService.canFinalizeCycle(summary)

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  🔒 ยืนยันการปิดรอบการจ่ายเงินเดือน
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  กรุณาตรวจสอบข้อมูลก่อนปิดรอบ (ไม่สามารถแก้ไขได้หลังจากปิดรอบ)
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>

            {/* Summary Information */}
            <Card className="p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลรอบการจ่ายเงินเดือน</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">ชื่อรอบ:</span>
                  <p className="font-medium">{summary.cycle_info.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">ช่วงเวลา:</span>
                  <p className="font-medium">
                    {formatDate(summary.cycle_info.start_date)} - {formatDate(summary.cycle_info.end_date)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">สถานะปัจจุบัน:</span>
                  <p className="font-medium">
                    <Badge className="bg-blue-100 text-blue-800">กำลังดำเนินการ</Badge>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">จำนวนพนักงาน:</span>
                  <p className="font-medium">{summary.totals.total_employees} คน</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ค่าแรงพื้นฐาน:</span>
                  <p className="font-semibold">{formatCurrency(summary.totals.total_base_pay)}</p>
                </div>
                <div>
                  <span className="text-gray-600">ค่าล่วงเวลา:</span>
                  <p className="font-semibold">{formatCurrency(summary.totals.total_overtime_pay)}</p>
                </div>
                <div>
                  <span className="text-gray-600">โบนัสรวม:</span>
                  <p className="font-semibold text-green-600">{formatCurrency(summary.totals.total_bonus)}</p>
                </div>
                <div>
                  <span className="text-gray-600">หักเงินรวม:</span>
                  <p className="font-semibold text-red-600">{formatCurrency(summary.totals.total_deduction)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">เงินเดือนสุทธิรวม:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(summary.totals.total_net_pay)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Validation Status */}
            <Card className="p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">สถานะการตรวจสอบ</h3>
              
              {finalizationCheck.canFinalize ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span className="font-medium text-green-800">พร้อมปิดรอบ</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    ไม่พบปัญหาใดๆ ระบบพร้อมปิดรอบการจ่ายเงินเดือนได้
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-red-600">❌</span>
                    <span className="font-medium text-red-800">ยังไม่สามารถปิดรอบได้</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {finalizationCheck.reasons.map((reason, index) => (
                      <li key={index}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Branch Summary */}
            {summary.branch_breakdown.length > 1 && (
              <Card className="p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">สรุปตามสาขา</h3>
                <div className="space-y-2">
                  {summary.branch_breakdown.map((branch) => (
                    <div key={branch.branch_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <span className="font-medium">{branch.branch_name}</span>
                        <span className="text-sm text-gray-600 ml-2">({branch.employee_count} คน)</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(branch.total_net_pay)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Critical Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">คำเตือนสำคัญ</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• หลังจากปิดรอบแล้ว จะไม่สามารถแก้ไขข้อมูลเงินเดือนในรอบนี้ได้อีก</li>
                    <li>• ข้อมูลทั้งหมดจะถูกบันทึกเป็นประวัติอย่างถาวร</li>
                    <li>• ระบบจะสร้าง audit log เพื่อติดตามการเปลี่ยนแปลง</li>
                    <li>• การดำเนินการนี้ไม่สามารถยกเลิกได้</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Confirmation Switch */}
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    ยืนยันการปิดรอบการจ่ายเงินเดือน
                  </span>
                  <p className="text-gray-600 mt-1">
                    ข้าพเจ้าได้ตรวจสอบข้อมูลแล้ว และเข้าใจว่าหลังจากปิดรอบแล้วจะไม่สามารถแก้ไขได้อีก
                  </p>
                </div>
                <Switch
                  checked={confirmed}
                  onCheckedChange={setConfirmed}
                  className="ml-3 mt-1"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">❌ {error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={finalizing}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleFinalize}
                disabled={!finalizationCheck.canFinalize || !confirmed || finalizing}
                className="bg-green-600 hover:bg-green-700 min-w-[140px]"
              >
                {finalizing ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>กำลังปิดรอบ...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>🔒</span>
                    <span>ปิดรอบการจ่ายเงินเดือน</span>
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}