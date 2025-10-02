'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Plus,
  Calculator,
  FileText,
  History
} from 'lucide-react'
import { PayrollService, type PayrollStats } from '../services/payroll.service'
import type { PayrollCycle } from '@employee-management/database'

type PayrollView = 'dashboard' | 'calculation' | 'summary' | 'bonus-deduction' | 'export' | 'history'

interface PayrollDashboardProps {
  onNavigate: (view: PayrollView, cycle?: PayrollCycle) => void
  onError: (error: string) => void
  refreshTrigger: number
}

export function PayrollDashboard({ onNavigate, onError, refreshTrigger }: PayrollDashboardProps) {
  const [stats, setStats] = useState<PayrollStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [refreshTrigger])

  const loadStats = async () => {
    try {
      setLoading(true)
      const result = await PayrollService.getPayrollStats()
      
      if (result.success) {
        setStats(result.data)
      } else {
        onError('เกิดข้อผิดพลาดในการโหลดสถิติ')
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      onError('เกิดข้อผิดพลาดในการโหลดสถิติ')
    } finally {
      setLoading(false)
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

  const renderStatsCards = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (!stats) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* รอบที่เปิดอยู่ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รอบที่เปิดอยู่
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.activeCycles}
            </div>
            <p className="text-xs text-muted-foreground">
              รอบการจ่ายที่กำลังดำเนินการ
            </p>
          </CardContent>
        </Card>

        {/* พนักงานทั้งหมด */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              พนักงานทั้งหมด
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">
              คนในระบบเงินเดือน
            </p>
          </CardContent>
        </Card>

        {/* ยอดจ่ายรวมเดือนนี้ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ยอดจ่ายรวมเดือนนี้
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.monthlyPayroll)}
            </div>
            <div className={`text-xs flex items-center ${
              stats.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.growthPercentage >= 0 ? '+' : ''}{stats.growthPercentage}% จากเดือนที่แล้ว
            </div>
          </CardContent>
        </Card>

        {/* รออนุมัติ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รออนุมัติ
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground">
              รายการรอการอนุมัติ
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderQuickActions = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            การดำเนินการหิรณ
          </CardTitle>
          <CardDescription>
            เลือกการดำเนินการที่ต้องการทำ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => onNavigate('dashboard')} // Will trigger cycle creation
            >
              <Plus className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">สร้างรอบใหม่</span>
              <span className="text-xs text-muted-foreground">เริ่มต้นรอบการจ่าย</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => onNavigate('calculation')}
            >
              <Calculator className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">คำนวณเงินเดือน</span>
              <span className="text-xs text-muted-foreground">คำนวณค่าแรงพนักงาน</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => onNavigate('summary')}
            >
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">สรุปการจ่าย</span>
              <span className="text-xs text-muted-foreground">ตรวจสอบก่อนปิดรอบ</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => onNavigate('history')}
            >
              <History className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">ประวัติรอบ</span>
              <span className="text-xs text-muted-foreground">ดูรอบที่ผ่านมา</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {renderStatsCards()}
      
      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Info Card */}
      {stats && stats.pendingApprovals > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            มีรายการรอการอนุมัติ {stats.pendingApprovals} รายการ กรุณาตรวจสอบและดำเนินการ
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}