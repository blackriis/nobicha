'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PayrollDashboard } from '@/features/payroll/components/PayrollDashboard'
import { PayrollCycleManager } from '@/features/payroll/components/PayrollCycleManager'
import { PayrollCalculation } from '@/features/payroll/components/PayrollCalculation'
import { PayrollSummary } from '@/features/payroll/components/PayrollSummary'
import { PayrollBonusDeduction } from '@/features/payroll/components/PayrollBonusDeduction'
import { PayrollExport } from '@/features/payroll/components/PayrollExport'
import { PayrollHistory } from '@/features/payroll/components/PayrollHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import type { PayrollCycle } from '@employee-management/database'

type PayrollView = 'dashboard' | 'calculation' | 'summary' | 'bonus-deduction' | 'export' | 'history'

interface PayrollPageState {
 currentView: PayrollView
 selectedCycle: PayrollCycle | null
 refreshTrigger: number
 loading: boolean
 error: string | null
}

export default function PayrollPage() {
 const [state, setState] = useState<PayrollPageState>({
  currentView: 'dashboard',
  selectedCycle: null,
  refreshTrigger: 0,
  loading: false,
  error: null
 })

 // Navigation handlers
 const handleNavigate = (view: PayrollView, cycle?: PayrollCycle) => {
  // Validate cycle requirement for certain views
  const viewsRequiringCycle: PayrollView[] = ['calculation', 'summary', 'bonus-deduction', 'export']

  if (viewsRequiringCycle.includes(view) && !cycle) {
   handleError('กรุณาเลือกรอบการจ่ายเงินเดือนก่อน')
   return
  }

  setState(prev => ({
   ...prev,
   currentView: view,
   selectedCycle: cycle || prev.selectedCycle,
   error: null
  }))
 }

 const handleBackToDashboard = () => {
  setState(prev => ({
   ...prev,
   currentView: 'dashboard',
   selectedCycle: null,
   error: null
  }))
 }

 const handleRefresh = () => {
  setState(prev => ({
   ...prev,
   refreshTrigger: prev.refreshTrigger + 1,
   error: null
  }))
 }

 // Error handling
 const handleError = (error: string) => {
  setState(prev => ({ ...prev, error, loading: false }))
 }

 // Loading state
 const setLoading = (loading: boolean) => {
  setState(prev => ({ ...prev, loading }))
 }

 // Render breadcrumb navigation
 const renderBreadcrumb = () => {
  const items: { label: string; view?: PayrollView }[] = [
   { label: 'จัดการเงินเดือน', view: 'dashboard' }
  ]

  switch (state.currentView) {
   case 'calculation':
    items.push({ label: `คำนวณเงินเดือน: ${state.selectedCycle?.cycle_name || 'ไม่ระบุ'}` })
    break
   case 'summary':
    items.push({ label: `สรุปการจ่าย: ${state.selectedCycle?.cycle_name || 'ไม่ระบุ'}` })
    break
   case 'bonus-deduction':
    items.push({ label: `จัดการโบนัส/หักเงิน: ${state.selectedCycle?.cycle_name || 'ไม่ระบุ'}` })
    break
   case 'export':
    items.push({ label: `ส่งออกรายงาน: ${state.selectedCycle?.cycle_name || 'ไม่ระบุ'}` })
    break
   case 'history':
    items.push({ label: 'ประวัติรอบการจ่าย' })
    break
  }

  return (
   <div className="flex items-center gap-2 mb-6">
    {items.map((item, index) => (
     <div key={index} className="flex items-center gap-2">
      {index > 0 && <span className="text-muted-foreground">/</span>}
      {item.view ? (
       <Button
        variant="ghost"
        size="sm"
        onClick={() => handleNavigate(item.view!)}
        className="h-auto p-1 font-normal"
       >
        {item.label}
       </Button>
      ) : (
       <Badge variant="outline">{item.label}</Badge>
      )}
     </div>
    ))}
   </div>
  )
 }

 // Render error state
 const renderError = () => {
  if (!state.error) return null

  return (
   <Card className="border-red-200 bg-red-50 mb-6">
    <CardContent className="pt-6">
     <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
      <div className="flex-1">
       <h4 className="font-medium text-red-900 mb-1">เกิดข้อผิดพลาด</h4>
       <p className="text-sm text-red-800">{state.error}</p>
      </div>
      <Button
       variant="outline"
       size="sm"
       onClick={() => setState(prev => ({ ...prev, error: null }))}
      >
       ปิด
      </Button>
     </div>
    </CardContent>
   </Card>
  )
 }

 // Render main content based on current view
 const renderContent = () => {
  switch (state.currentView) {
   case 'dashboard':
    return (
     <div className="space-y-6">
      <PayrollDashboard
       onNavigate={handleNavigate}
       onError={handleError}
       refreshTrigger={state.refreshTrigger}
      />
      <Separator />
      <PayrollCycleManager
       onNavigate={handleNavigate}
       onError={handleError}
       refreshTrigger={state.refreshTrigger}
      />
     </div>
    )

   case 'calculation':
    if (!state.selectedCycle) {
     return (
      <Card>
       <CardContent className="pt-6">
        <div className="text-center py-8">
         <p className="text-muted-foreground mb-4">ไม่พบข้อมูลรอบการจ่ายเงินเดือน</p>
         <Button onClick={handleBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้าหลัก
         </Button>
        </div>
       </CardContent>
      </Card>
     )
    }
    return (
     <PayrollCalculation
      cycle={state.selectedCycle}
      onNavigate={handleNavigate}
      onError={handleError}
      onSuccess={handleRefresh}
     />
    )

   case 'summary':
    if (!state.selectedCycle) {
     return (
      <Card>
       <CardContent className="pt-6">
        <div className="text-center py-8">
         <p className="text-muted-foreground mb-4">ไม่พบข้อมูลรอบการจ่ายเงินเดือน</p>
         <Button onClick={handleBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้าหลัก
         </Button>
        </div>
       </CardContent>
      </Card>
     )
    }
    return (
     <PayrollSummary
      cycle={state.selectedCycle}
      onNavigate={handleNavigate}
      onError={handleError}
      onSuccess={handleRefresh}
     />
    )

   case 'bonus-deduction':
    if (!state.selectedCycle) {
     return (
      <Card>
       <CardContent className="pt-6">
        <div className="text-center py-8">
         <p className="text-muted-foreground mb-4">ไม่พบข้อมูลรอบการจ่ายเงินเดือน</p>
         <Button onClick={handleBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้าหลัก
         </Button>
        </div>
       </CardContent>
      </Card>
     )
    }
    return (
     <PayrollBonusDeduction
      cycle={state.selectedCycle}
      onNavigate={handleNavigate}
      onError={handleError}
      onSuccess={handleRefresh}
     />
    )

   case 'export':
    if (!state.selectedCycle) {
     return (
      <Card>
       <CardContent className="pt-6">
        <div className="text-center py-8">
         <p className="text-muted-foreground mb-4">ไม่พบข้อมูลรอบการจ่ายเงินเดือน</p>
         <Button onClick={handleBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้าหลัก
         </Button>
        </div>
       </CardContent>
      </Card>
     )
    }
    return (
     <PayrollExport
      cycle={state.selectedCycle}
      onNavigate={handleNavigate}
      onError={handleError}
     />
    )

   case 'history':
    return (
     <PayrollHistory
      onNavigate={handleNavigate}
      onError={handleError}
     />
    )

   default:
    return null
  }
 }

 return (
  <AdminLayout>
   <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
     <div>
      <h1 className="text-3xl font-bold tracking-tight">จัดการเงินเดือน</h1>
      <p className="text-muted-foreground">
       ระบบคำนวณและจัดการเงินเดือนพนักงาน
      </p>
     </div>
     <div className="flex items-center gap-2">
      {state.currentView !== 'dashboard' && (
       <Button variant="outline" onClick={handleBackToDashboard}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        กลับหน้าหลัก
       </Button>
      )}
      <Button variant="outline" onClick={handleRefresh}>
       <RefreshCw className="h-4 w-4 mr-2" />
       รีเฟรช
      </Button>
     </div>
    </div>

    {/* Breadcrumb Navigation */}
    {renderBreadcrumb()}

    {/* Error Display */}
    {renderError()}

    {/* Main Content */}
    {renderContent()}
   </div>
  </AdminLayout>
 )
}