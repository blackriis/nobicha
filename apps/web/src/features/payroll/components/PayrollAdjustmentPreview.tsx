'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PayrollAdjustmentPreview as AdjustmentPreviewType } from '../services/payroll.service'
import { PayrollDetailUtils } from '../utils/payroll-detail.utils'

interface PayrollAdjustmentPreviewProps {
  preview: AdjustmentPreviewType | null
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  title?: string
  confirmText?: string
  cancelText?: string
}

export const PayrollAdjustmentPreview: React.FC<PayrollAdjustmentPreviewProps> = ({
  preview,
  onConfirm,
  onCancel,
  isLoading = false,
  title = 'ตรวจสอบการเปลี่ยนแปลง',
  confirmText = 'ยืนยันการเปลี่ยนแปลง',
  cancelText = 'ยกเลิก',
}) => {
  if (!preview) {
    return null
  }

  const hasChanges = 
    preview.new_bonus !== preview.current_bonus ||
    preview.new_deduction !== preview.current_deduction

  if (!hasChanges) {
    return (
      <Card className="p-6 border-gray-200">
        <div className="text-center py-4">
          <div className="text-gray-500 mb-2">ไม่มีการเปลี่ยนแปลง</div>
          <div className="text-sm text-gray-400">
            กรุณาทำการปรับปรุงค่าโบนัสหรือการหักเงิน
          </div>
        </div>
      </Card>
    )
  }

  const netPayDifference = preview.new_net_pay - preview.current_net_pay
  const percentageChange = PayrollDetailUtils.calculatePercentageChange(
    preview.current_net_pay,
    preview.new_net_pay
  )

  return (
    <Card className="overflow-hidden border-blue-200">
      {/* Header */}
      <div className="bg-blue-50 p-4 border-b border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900">{title}</h3>
        <p className="text-sm text-blue-700 mt-1">
          กรุณาตรวจสอบการเปลี่ยนแปลงก่อนยืนยัน
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Employee Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">ข้อมูลพนักงาน</h4>
          <div className="text-lg font-semibold text-gray-900">{preview.full_name}</div>
          <div className="text-sm text-gray-600">
            เงินเดือนพื้นฐาน: {PayrollDetailUtils.formatCurrency(preview.current_base_pay)}
          </div>
        </div>

        {/* Changes Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">ก่อนการเปลี่ยนแปลง</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">เงินเดือนพื้นฐาน:</span>
                <span>{PayrollDetailUtils.formatCurrency(preview.current_base_pay)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">โบนัส:</span>
                <span className={preview.current_bonus > 0 ? 'text-green-600' : 'text-gray-400'}>
                  {preview.current_bonus > 0 
                    ? PayrollDetailUtils.formatCurrency(preview.current_bonus)
                    : 'ไม่มี'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">หักเงิน:</span>
                <span className={preview.current_deduction > 0 ? 'text-red-600' : 'text-gray-400'}>
                  {preview.current_deduction > 0 
                    ? `${PayrollDetailUtils.formatCurrency(preview.current_deduction)}`
                    : 'ไม่มี'
                  }
                </span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex justify-between font-medium">
                <span>เงินเดือนสุทธิ:</span>
                <span className="text-gray-900">
                  {PayrollDetailUtils.formatCurrency(preview.current_net_pay)}
                </span>
              </div>
            </div>
          </div>

          {/* After */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">หลังการเปลี่ยนแปลง</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">เงินเดือนพื้นฐาน:</span>
                <span>{PayrollDetailUtils.formatCurrency(preview.current_base_pay)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">โบนัส:</span>
                <span className={`${
                  preview.new_bonus !== preview.current_bonus ? 'font-semibold' : ''
                } ${
                  preview.new_bonus && preview.new_bonus > 0 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {preview.new_bonus && preview.new_bonus > 0
                    ? PayrollDetailUtils.formatCurrency(preview.new_bonus)
                    : 'ไม่มี'
                  }
                  {preview.new_bonus !== preview.current_bonus && (
                    <span className="ml-1 text-xs text-blue-600">
                      (เปลี่ยนแปลง)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">หักเงิน:</span>
                <span className={`${
                  preview.new_deduction !== preview.current_deduction ? 'font-semibold' : ''
                } ${
                  preview.new_deduction && preview.new_deduction > 0 ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {preview.new_deduction && preview.new_deduction > 0
                    ? `${PayrollDetailUtils.formatCurrency(preview.new_deduction)}`
                    : 'ไม่มี'
                  }
                  {preview.new_deduction !== preview.current_deduction && (
                    <span className="ml-1 text-xs text-blue-600">
                      (เปลี่ยนแปลง)
                    </span>
                  )}
                </span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex justify-between font-medium">
                <span>เงินเดือนสุทธิ:</span>
                <span className={`font-bold ${
                  preview.new_net_pay < 0 
                    ? 'text-red-600'
                    : preview.new_net_pay < preview.current_base_pay * 0.5
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}>
                  {PayrollDetailUtils.formatCurrency(preview.new_net_pay)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className={`p-4 rounded-lg border-2 ${
          netPayDifference > 0 
            ? 'bg-green-50 border-green-200' 
            : netPayDifference < 0 
            ? 'bg-red-50 border-red-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h4 className="font-medium mb-2">ผลกระทบต่อเงินเดือนสุทธิ</h4>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className={`font-semibold ${
                netPayDifference > 0 
                  ? 'text-green-700' 
                  : netPayDifference < 0 
                  ? 'text-red-700'
                  : 'text-gray-700'
              }`}>
                {netPayDifference > 0 && '+'}
                {PayrollDetailUtils.formatCurrency(netPayDifference)}
              </div>
              <div className="text-xs text-gray-600">
                ({percentageChange.direction === 'increase' ? '+' : percentageChange.direction === 'decrease' ? '-' : ''}
                {percentageChange.formatted})
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              netPayDifference > 0 
                ? 'bg-green-200 text-green-800' 
                : netPayDifference < 0 
                ? 'bg-red-200 text-red-800'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {netPayDifference > 0 
                ? 'เพิ่มขึ้น' 
                : netPayDifference < 0 
                ? 'ลดลง'
                : 'ไม่เปลี่ยนแปลง'
              }
            </div>
          </div>
        </div>

        {/* Reason */}
        {preview.adjustment_reason && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">เหตุผล</h4>
            <div className="text-sm text-blue-800">
              <span className="inline-block px-2 py-1 bg-blue-100 rounded text-xs mr-2">
                {preview.adjustment_type === 'bonus' ? 'โบนัส' : 
                 preview.adjustment_type === 'deduction' ? 'หักเงิน' : 'โบนัส + หักเงิน'}
              </span>
              {preview.adjustment_reason}
            </div>
          </div>
        )}

        {/* Warning for low net pay */}
        {preview.new_net_pay < 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="text-red-600 font-bold text-lg">⚠️</div>
              <div>
                <div className="font-medium text-red-800">คำเตือน: เงินเดือนสุทธิติดลบ</div>
                <div className="text-sm text-red-600 mt-1">
                  การเปลี่ยนแปลงนี้จะทำให้เงินเดือนสุทธิติดลบ กรุณาตรวจสอบข้อมูลอีกครั้ง
                </div>
              </div>
            </div>
          </div>
        )}

        {preview.new_net_pay > 0 && preview.new_net_pay < preview.current_base_pay * 0.5 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="text-orange-600 font-bold text-lg">⚠️</div>
              <div>
                <div className="font-medium text-orange-800">แจ้งเตือน: เงินเดือนสุทธิต่ำมาก</div>
                <div className="text-sm text-orange-600 mt-1">
                  เงินเดือนสุทธิต่ำกว่า 50% ของเงินเดือนพื้นฐาน กรุณาพิจารณาความเหมาะสม
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-gray-50 p-4 border-t flex space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading || preview.new_net_pay < 0}
          className="flex-1"
        >
          {isLoading ? 'กำลังบันทึก...' : confirmText}
        </Button>
      </div>
    </Card>
  )
}