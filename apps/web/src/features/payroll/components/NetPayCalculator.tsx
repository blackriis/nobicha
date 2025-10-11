'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import type { NetPayCalculation } from '../utils/payroll-detail.utils'
import { PayrollDetailUtils } from '../utils/payroll-detail.utils'

interface NetPayCalculatorProps {
 base_pay: number
 overtime_pay?: number
 bonus?: number
 deduction?: number
 title?: string
 showBreakdown?: boolean
 highlightResult?: boolean
 className?: string
}

interface CalculationRowProps {
 label: string
 amount: number
 isSubtraction?: boolean
 isTotal?: boolean
 color?: 'default' | 'green' | 'red' | 'blue'
}

const CalculationRow: React.FC<CalculationRowProps> = ({
 label,
 amount,
 isSubtraction = false,
 isTotal = false,
 color = 'default'
}) => {
 const colorClasses = {
  default: 'text-gray-900',
  green: 'text-green-600',
  red: 'text-red-600',
  blue: 'text-blue-600'
 }

 const amountColorClasses = {
  default: 'text-gray-900',
  green: 'text-green-600',
  red: 'text-red-600',
  blue: 'text-blue-900'
 }

 return (
  <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t border-gray-300 pt-3 mt-2' : ''}`}>
   <span className={`text-sm ${isTotal ? 'font-semibold' : ''} ${colorClasses[color]}`}>
    {isSubtraction && amount > 0 ? '- ' : ''}{label}
   </span>
   <span className={`text-sm ${isTotal ? 'font-bold text-lg' : 'font-medium'} ${amountColorClasses[color]}`}>
    {isSubtraction && amount > 0 ? '-' : ''}
    {PayrollDetailUtils.formatCurrency(amount)}
   </span>
  </div>
 )
}

export const NetPayCalculator: React.FC<NetPayCalculatorProps> = ({
 base_pay,
 overtime_pay = 0,
 bonus = 0,
 deduction = 0,
 title = 'การคำนวณเงินเดือนสุทธิ',
 showBreakdown = true,
 highlightResult = true,
 className = '',
}) => {
 const calculation = PayrollDetailUtils.calculateNetPay(
  base_pay,
  overtime_pay,
  bonus,
  deduction
 )

 const isNegative = calculation.net_pay < 0
 const isLowPay = calculation.net_pay > 0 && calculation.net_pay < base_pay * 0.5
 const isWarning = calculation.net_pay > 0 && calculation.net_pay < base_pay * 0.7

 const getResultColor = (): 'default' | 'green' | 'red' | 'blue' => {
  if (isNegative) return 'red'
  if (isLowPay) return 'red'
  if (isWarning) return 'blue'
  return 'green'
 }

 const getWarningMessage = (): string | null => {
  if (isNegative) {
   return '⚠️ เตือน: เงินเดือนสุทธิติดลบ - กรุณาตรวจสอบการหักเงิน'
  }
  if (isLowPay) {
   return '⚠️ เตือน: เงินเดือนสุทธิต่ำกว่า 50% ของเงินเดือนพื้นฐาน'
  }
  if (isWarning) {
   return '⚠️ แจ้งเตือน: เงินเดือนสุทธิต่ำกว่า 70% ของเงินเดือนพื้นฐาน'
  }
  return null
 }

 return (
  <Card className={`${className} ${highlightResult ? 'border-blue-200' : ''}`}>
   {/* Header */}
   <div className={`p-4 border-b ${highlightResult ? 'bg-blue-50' : 'bg-gray-50'}`}>
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    {showBreakdown && (
     <p className="text-xs text-gray-600 mt-1">
      สูตร: เงินเดือนพื้นฐาน + ค่าล่วงเวลา + โบนัส - หักเงิน
     </p>
    )}
   </div>

   <div className="p-4">
    {showBreakdown ? (
     <div className="space-y-1">
      {/* Base pay */}
      <CalculationRow
       label="เงินเดือนพื้นฐาน"
       amount={base_pay}
       color="default"
      />

      {/* Overtime pay */}
      {overtime_pay > 0 && (
       <CalculationRow
        label="ค่าล่วงเวลา"
        amount={overtime_pay}
        color="green"
       />
      )}

      {/* Bonus */}
      {bonus > 0 ? (
       <CalculationRow
        label="โบนัส"
        amount={bonus}
        color="green"
       />
      ) : (
       <CalculationRow
        label="โบนัส"
        amount={0}
        color="default"
       />
      )}

      {/* Deduction */}
      {deduction > 0 ? (
       <CalculationRow
        label="หักเงิน"
        amount={deduction}
        color="red"
        isSubtraction={true}
       />
      ) : (
       <CalculationRow
        label="หักเงิน"
        amount={0}
        color="default"
       />
      )}

      {/* Net pay result */}
      <CalculationRow
       label="เงินเดือนสุทธิ"
       amount={calculation.net_pay}
       color={getResultColor()}
       isTotal={true}
      />
     </div>
    ) : (
     /* Simple display */
     <div className="text-center">
      <div className="text-sm text-gray-600 mb-2">เงินเดือนสุทธิ</div>
      <div className={`text-2xl font-bold ${
       isNegative ? 'text-red-600' : isLowPay ? 'text-orange-600' : 'text-green-600'
      }`}>
       {PayrollDetailUtils.formatCurrency(calculation.net_pay)}
      </div>
     </div>
    )}

    {/* Warning message */}
    {getWarningMessage() && (
     <div className={`mt-4 p-3 rounded-lg text-sm ${
      isNegative || isLowPay 
       ? 'bg-red-50 border border-red-200 text-red-700'
       : 'bg-orange-50 border border-orange-200 text-orange-700'
     }`}>
      {getWarningMessage()}
     </div>
    )}

    {/* Additional info */}
    {showBreakdown && calculation.net_pay > 0 && (
     <div className="mt-4 pt-3 border-t border-gray-200">
      <div className="flex justify-between text-xs text-gray-500">
       <span>เปอร์เซ็นต์ของเงินเดือนพื้นฐาน:</span>
       <span className="font-medium">
        {((calculation.net_pay / base_pay) * 100).toFixed(1)}%
       </span>
      </div>
      {(bonus > 0 || deduction > 0) && (
       <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>ผลต่างจากเงินเดือนพื้นฐาน:</span>
        <span className={`font-medium ${
         calculation.net_pay > base_pay ? 'text-green-600' : 
         calculation.net_pay < base_pay ? 'text-red-600' : 'text-gray-600'
        }`}>
         {calculation.net_pay > base_pay ? '+' : ''}
         {PayrollDetailUtils.formatCurrency(calculation.net_pay - base_pay)}
        </span>
       </div>
      )}
     </div>
    )}
   </div>
  </Card>
 )
}

// Utility component for quick inline calculations
export const InlineNetPayCalculator: React.FC<{
 base_pay: number
 overtime_pay?: number
 bonus?: number
 deduction?: number
 className?: string
}> = ({ base_pay, overtime_pay = 0, bonus = 0, deduction = 0, className = '' }) => {
 const net_pay = base_pay + overtime_pay + bonus - deduction
 const isNegative = net_pay < 0
 const isLowPay = net_pay > 0 && net_pay < base_pay * 0.5

 return (
  <span className={`font-medium ${
   isNegative ? 'text-red-600' : isLowPay ? 'text-orange-600' : 'text-green-600'
  } ${className}`}>
   {PayrollDetailUtils.formatCurrency(net_pay)}
  </span>
 )
}