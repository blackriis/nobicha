'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PayrollService, type PayrollSummaryResponse } from '../services/payroll.service'

interface PayrollFinalizationSummaryProps {
  cycleId: string
  onFinalize?: () => void
  onExport?: () => void
}

export default function PayrollFinalizationSummary({ 
  cycleId, 
  onFinalize, 
  onExport 
}: PayrollFinalizationSummaryProps) {
  const [summary, setSummary] = useState<PayrollSummaryResponse['summary'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await PayrollService.getPayrollSummary(cycleId)
      
      if (result.success) {
        setSummary(result.data.summary)
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด')
      console.error('Load summary error:', err)
    } finally {
      setLoading(false)
    }
  }, [cycleId])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

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

  const getValidationBadge = (canFinalize: boolean) => {
    if (canFinalize) {
      return <Badge className="bg-green-100 text-green-800">✅ พร้อมปิดรอบ</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">❌ ยังไม่พร้อม</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
          <Button onClick={loadSummary} variant="outline">
            ลองใหม่
          </Button>
        </div>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>ไม่พบข้อมูลสรุปรอบการจ่ายเงินเดือน</p>
        </div>
      </Card>
    )
  }

  const finalizationCheck = PayrollService.canFinalizeCycle(summary)

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              สรุปรอบการจ่ายเงินเดือน
            </h3>
            <p className="text-xl font-bold text-blue-600">{summary.cycle_info.name}</p>
          </div>
          <div className="text-right">
            {getStatusBadge(summary.cycle_info.status)}
            <div className="mt-2">
              {getValidationBadge(finalizationCheck.canFinalize)}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>📅 ช่วงเวลา: {formatDate(summary.cycle_info.start_date)} - {formatDate(summary.cycle_info.end_date)}</p>
          {summary.cycle_info.finalized_at && (
            <p>✅ ปิดรอบเมื่อ: {formatDate(summary.cycle_info.finalized_at)}</p>
          )}
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {summary.totals.total_employees}
            </div>
            <div className="text-sm text-blue-800">จำนวนพนักงาน</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totals.total_net_pay)}
            </div>
            <div className="text-sm text-green-800">เงินเดือนสุทธิรวม</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(summary.totals.average_net_pay)}
            </div>
            <div className="text-sm text-purple-800">เงินเดือนเฉลี่ย</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
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

        {/* Validation Issues */}
        {!finalizationCheck.canFinalize && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-red-800 mb-2">ปัญหาที่ต้องแก้ไขก่อนปิดรอบ:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {finalizationCheck.reasons.map((reason, index) => (
                <li key={index}>• {reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Details */}
        {summary.validation.issues_count > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-yellow-800 mb-2">รายละเอียดปัญหาที่พบ:</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              {summary.validation.employees_with_negative_net_pay > 0 && (
                <p>• พนักงานที่มีเงินเดือนสุทธิติดลบ: {summary.validation.employees_with_negative_net_pay} คน</p>
              )}
              {summary.validation.employees_with_missing_data > 0 && (
                <p>• พนักงานที่ข้อมูลไม่ครบถ้วน: {summary.validation.employees_with_missing_data} คน</p>
              )}
            </div>
            
            {summary.validation.validation_issues.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2"
              >
                {showDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียดปัญหา'}
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            {onExport && (
              <Button
                variant="outline"
                onClick={onExport}
              >
                📊 ส่งออกรายงาน
              </Button>
            )}
          </div>
          
          <div className="space-x-2">
            {summary.cycle_info.status === 'active' && finalizationCheck.canFinalize && onFinalize && (
              <Button
                onClick={onFinalize}
                className="bg-green-600 hover:bg-green-700"
              >
                🔒 ปิดรอบการจ่ายเงินเดือน
              </Button>
            )}
            
            {!finalizationCheck.canFinalize && (
              <Button
                disabled
                variant="outline"
              >
                🔒 ยังไม่สามารถปิดรอบได้
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Issue Details */}
      {showDetails && summary.validation.validation_issues.length > 0 && (
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            รายละเอียดปัญหาที่พบ
          </h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {summary.validation.validation_issues.map((issue, index) => (
              <div key={index} className="border rounded-lg p-3 bg-red-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-red-800">{issue.employee_name}</div>
                    <div className="text-sm text-red-600">
                      รหัสพนักงาน: {issue.employee_id || 'ไม่มี'}
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    {issue.type === 'negative_net_pay' ? 'เงินเดือนติดลบ' : 'ข้อมูลไม่ครบ'}
                  </Badge>
                </div>
                {issue.details && (
                  <div className="text-sm text-red-600 mt-2">
                    รายละเอียด: {JSON.stringify(issue.details)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Branch Breakdown */}
      {summary.branch_breakdown.length > 0 && (
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            สรุปตามสาขา
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.branch_breakdown.map((branch) => (
              <div key={branch.branch_id} className="border rounded-lg p-4 bg-gray-50">
                <div className="font-medium text-gray-900 mb-2">{branch.branch_name}</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>พนักงาน: {branch.employee_count} คน</p>
                  <p>เงินเดือนรวม: {formatCurrency(branch.total_net_pay)}</p>
                  <p>โบนัส: {formatCurrency(branch.total_bonus)}</p>
                  <p>หักเงิน: {formatCurrency(branch.total_deduction)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}