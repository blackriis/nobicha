'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calculator, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { PayrollService, type PayrollCalculationResponse } from '../services/payroll.service'
import type { PayrollCycle } from '@employee-management/database'

type PayrollView = 'dashboard' | 'calculation' | 'summary' | 'bonus-deduction' | 'export' | 'history'

interface PayrollCalculationProps {
  cycle: PayrollCycle
  onNavigate: (view: PayrollView, cycle?: PayrollCycle) => void
  onError: (error: string) => void
  onSuccess: () => void
}

interface CalculationState {
  isCalculating: boolean
  isCompleted: boolean
  result: PayrollCalculationResponse | null
  progress: number
  currentStep: string
}

export function PayrollCalculation({ cycle, onNavigate, onError, onSuccess }: PayrollCalculationProps) {
  const [state, setState] = useState<CalculationState>({
    isCalculating: false,
    isCompleted: false,
    result: null,
    progress: 0,
    currentStep: ''
  })

  const handleCalculate = async () => {
    setState(prev => ({
      ...prev,
      isCalculating: true,
      isCompleted: false,
      progress: 0,
      currentStep: 'เริ่มต้นการคำนวณ...'
    }))

    try {
      // Simulate progress steps
      const steps = [
        { progress: 20, step: 'กำลังดึงข้อมูลพนักงาน...' },
        { progress: 40, step: 'กำลังดึงข้อมูลเวลาทำงาน...' },
        { progress: 60, step: 'กำลังคำนวณค่าแรง...' },
        { progress: 80, step: 'กำลังบันทึกผลการคำนวณ...' },
        { progress: 100, step: 'เสร็จสิ้น!' }
      ]

      for (const stepData of steps) {
        setState(prev => ({
          ...prev,
          progress: stepData.progress,
          currentStep: stepData.step
        }))
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Actual API call
      const result = await PayrollService.calculatePayroll(cycle.id)
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          isCalculating: false,
          isCompleted: true,
          result: result.data
        }))
        onSuccess()
      } else {
        // Provide more detailed error information
        const errorMessage = result.error || 'การคำนวณล้มเหลว'
        console.error('Payroll calculation failed:', result)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Calculation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการคำนวณเงินเดือน'
      onError(errorMessage)
      setState(prev => ({
        ...prev,
        isCalculating: false,
        isCompleted: false,
        progress: 0,
        currentStep: ''
      }))
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

  const formatDateThai = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const renderCycleInfo = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            ข้อมูลรอบการจ่ายเงินเดือน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ชื่อรอบ</p>
              <p className="text-lg font-semibold">{cycle.cycle_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ช่วงเวลา</p>
              <p className="text-sm">
                {formatDateThai(cycle.start_date)} - {formatDateThai(cycle.end_date)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">สถานะ</p>
              <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>
                {cycle.status === 'active' ? 'เปิดอยู่' : 'ปิดแล้ว'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCalculationProcess = () => {
    if (!state.isCalculating && !state.isCompleted) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>เริ่มต้นการคำนวณเงินเดือน</CardTitle>
            <CardDescription>
              คำนวณเงินเดือนสำหรับพนักงานทั้งหมดในรอบนี้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                การคำนวณจะใช้เวลาสักครู่ กรุณาอย่าปิดหน้าต่างระหว่างการดำเนินการ
              </AlertDescription>
            </Alert>
            <Button onClick={handleCalculate} className="w-full" size="lg">
              <Calculator className="h-4 w-4 mr-2" />
              เริ่มคำนวณเงินเดือน
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (state.isCalculating) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              กำลังคำนวณเงินเดือน...
            </CardTitle>
            <CardDescription>
              กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{state.currentStep}</span>
                <span>{state.progress}%</span>
              </div>
              <Progress value={state.progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  const renderCalculationResult = () => {
    if (!state.isCompleted || !state.result) return null

    const { calculation_summary, employee_calculations } = state.result

    return (
      <div className="space-y-6">
        {/* Success Alert */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            คำนวณเงินเดือนเรียบร้อยแล้ว! พบพนักงาน {calculation_summary.total_employees} คน 
            ยอดรวม {formatCurrency(calculation_summary.total_base_pay)}
          </AlertDescription>
        </Alert>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">จำนวนพนักงาน</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculation_summary.total_employees}</div>
              <p className="text-xs text-muted-foreground">
                คนที่ได้รับการคำนวณ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ยอดรวมค่าแรง</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(calculation_summary.total_base_pay)}
              </div>
              <p className="text-xs text-muted-foreground">
                ก่อนโบนัสและหักเงิน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ค่าเฉลี่ย/คน</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(calculation_summary.total_base_pay / calculation_summary.total_employees)}
              </div>
              <p className="text-xs text-muted-foreground">
                เงินเดือนเฉลี่ยต่อคน
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Employee List Preview */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดการคำนวณ (แสดง 5 คนแรก)</CardTitle>
            <CardDescription>
              ผลการคำนวณเงินเดือนของพนักงานแต่ละคน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employee_calculations.slice(0, 5).map((employee, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{employee.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.total_hours} ชั่วโมง • {employee.total_days_worked} วัน • {employee.calculation_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(employee.base_pay)}
                    </p>
                  </div>
                </div>
              ))}
              
              {employee_calculations.length > 5 && (
                <div className="text-center text-muted-foreground text-sm pt-2">
                  และอีก {employee_calculations.length - 5} คน...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Actions */}
        <Card>
          <CardHeader>
            <CardTitle>ขั้นตอนถัดไป</CardTitle>
            <CardDescription>
              เลือกการดำเนินการที่ต้องการทำต่อ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => onNavigate('bonus-deduction', cycle)}
                className="flex-1"
              >
                จัดการโบนัส/หักเงิน
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                onClick={() => onNavigate('summary', cycle)}
                variant="outline"
                className="flex-1"
              >
                ดูสรุปการจ่าย
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cycle Info */}
      {renderCycleInfo()}

      {/* Calculation Process */}
      {renderCalculationProcess()}

      {/* Calculation Results */}
      {renderCalculationResult()}
    </div>
  )
}