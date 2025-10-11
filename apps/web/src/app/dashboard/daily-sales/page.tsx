'use client'

import { useState, useEffect } from 'react'
import { EmployeeDashboardHeader } from '@/components/dashboard/EmployeeDashboardHeader'
import { DailySalesForm } from '@/components/employee/DailySalesForm'
import { SalesReportHistory } from '@/components/employee/SalesReportHistory'
import { SalesReportsService } from '@/lib/services/sales-reports.service'
import { timeEntryService } from '@/lib/services/time-entry.service'
import { getCurrentReportDate, formatThaiDate } from '@/lib/utils/sales-reports.utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
// Tabs component not available, using simple layout
import { Calendar, TrendingUp, AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import type { User } from '@employee-management/database'

interface UserWithBranch extends User {
 home_branch?: {
  id: string
  name: string
  latitude: number
  longitude: number
 }
}

export default function DailySalesPage() {
 const { user, loading: authLoading } = useAuth()
 const router = useRouter()
 
 // State
 const [userProfile, setUserProfile] = useState<UserWithBranch | null>(null)
 const [todayReportExists, setTodayReportExists] = useState<boolean>(false)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [refreshTrigger, setRefreshTrigger] = useState(0)
 
 // Check-in branch state
 const [checkInBranch, setCheckInBranch] = useState<{
  branchId: string;
  branchName: string;
  checkInTime: string;
  isActive?: boolean; // Add flag to track if still checked in
 } | null>(null)
 const [checkInError, setCheckInError] = useState<string | null>(null)

 // Check authentication and role
 useEffect(() => {
  if (authLoading) return

  if (!user) {
   router.push('/login/employee')
   return
  }

  // Type assertion since we know the user structure from auth context
  const userData = user as UserWithBranch
  setUserProfile(userData)

  // Check check-in status and today's report
  checkCheckInStatus()
 }, [user, authLoading, router])

 // Check check-in status and today's report
 const checkCheckInStatus = async () => {
  try {
   setLoading(true)
   setError(null)
   setCheckInError(null)

   // Get time entry status to check both latest branch and active status
   const statusResult = await timeEntryService.getStatus()
   
   // Check if there's an active check-in
   if (statusResult.isCheckedIn && statusResult.activeEntry) {
    setCheckInBranch({
     branchId: statusResult.activeEntry.branch.id,
     branchName: statusResult.activeEntry.branch.name,
     checkInTime: statusResult.activeEntry.checkInTime,
     isActive: true
    })
    await checkTodayReport()
   } else {
    // Check for latest check-in (even if checked out)
    const checkInResult = await timeEntryService.getTodaysLatestCheckInBranch()
    
    if (checkInResult.success && checkInResult.data) {
     setCheckInBranch({
      ...checkInResult.data,
      isActive: false
     })
     await checkTodayReport()
    } else {
     setCheckInError(checkInResult.error || 'กรุณาเช็คอินที่สาขาก่อนทำการรายงานยอดขาย')
     setCheckInBranch(null)
    }
   }
  } catch (error) {
   console.error('Check check-in status error:', error)
   setCheckInError('เกิดข้อผิดพลาดในการตรวจสอบสถานะเช็คอิน')
  } finally {
   setLoading(false)
  }
 }

 // Check if employee has already reported today
 const checkTodayReport = async () => {
  try {
   const response = await SalesReportsService.getTodaysReport()
   
   if (response.success) {
    setTodayReportExists(response.data ? response.data.length > 0 : false)
   } else {
    // Don't show error for authentication failures - these are handled by auth context
    if (response.error && !response.error.includes('Authentication') && !response.error.includes('Unauthorized')) {
     setError(response.error || 'ไม่สามารถตรวจสอบสถานะรายงานได้')
    }
   }
  } catch (error) {
   console.error('Check today report error:', error)
   // Don't show generic connection errors during auth flow
   if (window.location.pathname === '/dashboard/daily-sales') {
    setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
   }
  }
 }

 // Handle successful submission
 const handleSubmissionSuccess = () => {
  setTodayReportExists(true)
  setRefreshTrigger(prev => prev + 1)
 }

 if (authLoading || loading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-black">
    <EmployeeDashboardHeader />
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
     <Card>
      <CardContent className="p-8 text-center">
       <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
       <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </CardContent>
     </Card>
    </div>
   </div>
  )
 }

 if (checkInError) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-black">
    <EmployeeDashboardHeader />
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
     <Card className="border-destructive">
      <CardContent className="p-8 text-center">
       <div className="text-destructive mb-4">
        <h3 className="font-medium">ต้องเช็คอินก่อน</h3>
        <p className="text-sm mt-1">{checkInError}</p>
       </div>
       <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
        ไปหน้าเช็คอิน
       </Button>
      </CardContent>
     </Card>
    </div>
   </div>
  )
 }

 const currentDate = getCurrentReportDate()
 const branchName = checkInBranch?.branchName || 'ไม่ระบุ'

 const handleRefresh = () => {
  checkCheckInStatus()
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-black">
   <EmployeeDashboardHeader />
   
   <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
     <div>
      <h1 className="text-2xl font-bold text-gray-900">รายงานยอดขายรายวัน</h1>
      <p className="text-sm text-gray-600 mt-1">
       วันที่ {formatThaiDate(new Date())} | สาขา{branchName}
      </p>
     </div>
     <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={loading}
     >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      รีเฟรช
     </Button>
    </div>

    {/* Status Banner */}
    <div className="max-w-2xl mx-auto">
     <Card className={`border-l-4 ${
      todayReportExists 
       ? 'border-l-green-500 bg-green-50' 
       : 'border-l-blue-500 bg-blue-50'
     }`}>
      <CardContent className="py-4">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
         {todayReportExists ? (
          <CheckCircle2 className="h-6 w-6 text-green-600" />
         ) : (
          <TrendingUp className="h-6 w-6 text-blue-600" />
         )}
         <div>
          <p className={`font-medium ${
           todayReportExists ? 'text-green-800' : 'text-blue-800'
          }`}>
           สาขา{branchName} • {formatThaiDate(new Date())}
          </p>
          <p className={`text-sm ${
           todayReportExists ? 'text-green-600' : 'text-blue-600'
          }`}>
           {todayReportExists 
            ? 'รายงานยอดขายเสร็จสิ้นแล้ว' 
            : 'พร้อมรายงานยอดขาย'
           }
          </p>
         </div>
        </div>
        {checkInBranch && (
         <div className="text-right">
          <p className="text-xs text-gray-500">เช็คอิน</p>
          <p className="text-sm font-medium text-gray-700">
           {new Date(checkInBranch.checkInTime).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
           })} น.
          </p>
         </div>
        )}
       </div>
      </CardContent>
     </Card>
    </div>

    {/* Main Content */}
    <div className="space-y-8">
     {/* Daily Sales Form */}
     <div>
      <DailySalesForm
       branchName={branchName}
       onSubmissionSuccess={handleSubmissionSuccess}
       disabled={todayReportExists}
      />
     </div>

     {/* Reports History */}
     <div className="space-y-6">
      {/* Today's Report */}
      <div>
       <h3 className="text-lg font-medium text-gray-900 mb-3">
        รายงานวันนี้
       </h3>
       <SalesReportHistory
        refreshTrigger={refreshTrigger}
        showTodayOnly={true}
       />
      </div>

      {/* All Reports History */}
      <div>
       <h3 className="text-lg font-medium text-gray-900 mb-3">
        ประวัติรายงานทั้งหมด
       </h3>
       <SalesReportHistory
        refreshTrigger={refreshTrigger}
        showTodayOnly={false}
       />
      </div>
     </div>
    </div>
   </div>
  </div>
 )
}
