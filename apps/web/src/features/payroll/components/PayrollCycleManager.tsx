'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Calendar, 
  Calculator, 
  FileText, 
  Settings, 
  MoreVertical,
  RefreshCw,
  Trash2,
  Download,
  DollarSign
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PayrollService, type CreatePayrollCycleData } from '../services/payroll.service'
import type { PayrollCycle } from '@employee-management/database'

type PayrollView = 'dashboard' | 'calculation' | 'summary' | 'bonus-deduction' | 'export' | 'history'

interface PayrollCycleManagerProps {
  onNavigate: (view: PayrollView, cycle?: PayrollCycle) => void
  onError: (error: string) => void
  refreshTrigger: number
}

interface CreateCycleFormData {
  name: string
  start_date: string
  end_date: string
}

export function PayrollCycleManager({ onNavigate, onError, refreshTrigger }: PayrollCycleManagerProps) {
  const [cycles, setCycles] = useState<PayrollCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<CreateCycleFormData>({
    name: '',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    loadCycles()
  }, [refreshTrigger])

  const loadCycles = async () => {
    try {
      setLoading(true)
      const result = await PayrollService.getPayrollCycles()
      
      if (result.success) {
        setCycles(result.data.payroll_cycles)
      } else {
        onError('เกิดข้อผิดพลาดในการโหลดรายการรอบการจ่ายเงินเดือน')
      }
    } catch (error) {
      console.error('Error loading cycles:', error)
      onError('เกิดข้อผิดพลาดในการโหลดรายการรอบการจ่ายเงินเดือน')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCycle = async () => {
    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
      onError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    try {
      setCreating(true)
      const result = await PayrollService.createPayrollCycle(formData)
      
      if (result.success) {
        setShowCreateDialog(false)
        setFormData({ name: '', start_date: '', end_date: '' })
        loadCycles()
      } else {
        onError('เกิดข้อผิดพลาดในการสร้างรอบการจ่ายเงินเดือน')
      }
    } catch (error) {
      console.error('Error creating cycle:', error)
      onError('เกิดข้อผิดพลาดในการสร้างรอบการจ่ายเงินเดือน')
    } finally {
      setCreating(false)
    }
  }

  const handleResetCycle = async (cycle: PayrollCycle) => {
    try {
      const result = await PayrollService.resetPayrollCycle(cycle.id)
      if (result.success) {
        loadCycles()
      } else {
        onError('เกิดข้อผิดพลาดในการรีเซ็ตรอบการจ่ายเงินเดือน')
      }
    } catch (error) {
      console.error('Error resetting cycle:', error)
      onError('เกิดข้อผิดพลาดในการรีเซ็ตรอบการจ่ายเงินเดือน')
    }
  }

  const formatDateThai = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'เปิดอยู่'
      case 'completed':
        return 'ปิดแล้ว'
      case 'draft':
        return 'ร่าง'
      default:
        return status
    }
  }

  const renderCreateDialog = () => {
    return (
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            สร้างรอบใหม่
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>สร้างรอบการจ่ายเงินเดือนใหม่</DialogTitle>
            <DialogDescription>
              กำหนดชื่อและระยะเวลาของรอบการจ่ายเงินเดือน
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">ชื่อรอบการจ่าย</Label>
              <Input
                id="name"
                placeholder="เช่น เงินเดือนประจำเดือนมกราคม 2568"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">วันที่เริ่มต้น</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">วันที่สิ้นสุด</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateCycle} disabled={creating}>
              {creating ? 'กำลังสร้าง...' : 'สร้างรอบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const renderCycleCard = (cycle: PayrollCycle) => {
    return (
      <Card key={cycle.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{cycle.cycle_name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDateThai(cycle.start_date)} - {formatDateThai(cycle.end_date)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(cycle.status)}>
                {getStatusText(cycle.status)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {cycle.status === 'active' && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => onNavigate('calculation', cycle)}
                        className="cursor-pointer"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        คำนวณเงินเดือน
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onNavigate('bonus-deduction', cycle)}
                        className="cursor-pointer"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        จัดการโบนัส/หักเงิน
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onNavigate('summary', cycle)}
                        className="cursor-pointer"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        สรุปก่อนปิดรอบ
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            className="cursor-pointer text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            รีเซ็ตข้อมูล
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>รีเซ็ตข้อมูลเงินเดือน</AlertDialogTitle>
                            <AlertDialogDescription>
                              การดำเนินการนี้จะลบข้อมูลการคำนวณเงินเดือนทั้งหมดในรอบ "{cycle.cycle_name}" 
                              และสามารถคำนวณใหม่ได้ คุณต้องการดำเนินการต่อหรือไม่?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleResetCycle(cycle)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              รีเซ็ต
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  <DropdownMenuItem 
                    onClick={() => onNavigate('export', cycle)}
                    className="cursor-pointer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออกรายงาน
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>สร้างเมื่อ: {formatDateThai(cycle.created_at)}</span>
            {cycle.status === 'active' && (
              <Button 
                size="sm" 
                onClick={() => onNavigate('calculation', cycle)}
                className="h-7"
              >
                เริ่มคำนวณ
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCyclesList = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (cycles.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">ยังไม่มีรอบการจ่ายเงินเดือน</h3>
              <p className="text-muted-foreground mb-4">
                เริ่มต้นโดยการสร้างรอบการจ่ายเงินเดือนแรกของคุณ
              </p>
              {renderCreateDialog()}
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {cycles.map(renderCycleCard)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">รอบการจ่ายเงินเดือน</h2>
          <p className="text-muted-foreground">
            จัดการและติดตามรอบการจ่ายเงินเดือนทั้งหมด
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadCycles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
          {cycles.length > 0 && renderCreateDialog()}
        </div>
      </div>

      {/* Cycles List */}
      {renderCyclesList()}
    </div>
  )
}