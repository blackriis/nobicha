'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EmployeeForm } from './EmployeeForm'
import { EmployeeUpdateData, EmployeeDetail } from '@/lib/services/employee.service'
import { branchService } from '@/lib/services/branch.service'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Branch {
 id: string
 name: string
 address: string
}

interface EditEmployeePageProps {
 employeeId: string
}

export function EditEmployeePage({ employeeId }: EditEmployeePageProps) {
 const router = useRouter()
 const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
 const [branches, setBranches] = useState<Branch[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [success, setSuccess] = useState<string | null>(null)

 // Load employee and branches on component mount
 useEffect(() => {
  if (employeeId) {
   loadData()
  }
 }, [employeeId])

 const loadData = async () => {
  try {
   setLoading(true)
   setError(null)
   
   // Get auth token from Supabase session
   const { createClientComponentClient } = await import('@/lib/supabase')
   const supabase = createClientComponentClient()
   const { data: { session }, error: sessionError } = await supabase.auth.getSession()
   
   if (sessionError || !session?.access_token) {
    setError('ไม่พบการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่')
    return
   }
   
   // Load employee via API and branches via service in parallel
   const [employeeResponse, branchesResult] = await Promise.all([
    fetch(`/api/admin/employees/${employeeId}`, {
     headers: {
      'Authorization': `Bearer ${session.access_token}`
     }
    }),
    branchService.getAllBranches()
   ])
   
   // Handle employee API response
   if (!employeeResponse.ok) {
    if (employeeResponse.status === 404) {
     setError('ไม่พบข้อมูลพนักงานรายการนี้')
     return
    }
    const errorData = await employeeResponse.json().catch(() => ({ error: 'Unknown error' }))
    setError(errorData.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน')
    return
   }
   
   const employeeData = await employeeResponse.json()
   const employeeResult = employeeData.employee

   if (!employeeResult) {
    setError('ไม่พบข้อมูลพนักงานรายการนี้')
    return
   }

   if (!branchesResult.success || !branchesResult.data || branchesResult.data.length === 0) {
    setError('ไม่พบข้อมูลสาขา')
    return
   }

   setEmployee(employeeResult)
   setBranches(branchesResult.data)
  } catch (err) {
   console.error('Load data error:', {
    error: err,
    message: err instanceof Error ? err.message : 'Unknown error',
    employeeId: employeeId
   })
   
   if (err instanceof Error) {
    if (err.message.includes('not found') || err.message.includes('Employee not found')) {
     setError('ไม่พบข้อมูลพนักงานรายการนี้')
    } else if (err.message.includes('Invalid employee ID')) {
     setError('รหัสพนักงานไม่ถูกต้อง')
    } else {
     setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}`)
    }
   } else {
    setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
   }
  } finally {
   setLoading(false)
  }
 }

 const handleSubmit = async (data: EmployeeUpdateData) => {
  try {
   setError(null)
   setSuccess(null)
   
   // Get auth token from Supabase session
   const { createClientComponentClient } = await import('@/lib/supabase')
   const supabase = createClientComponentClient()
   const { data: { session }, error: sessionError } = await supabase.auth.getSession()
   
   if (sessionError || !session?.access_token) {
    setError('ไม่พบการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่')
    return { success: false, error: 'No auth token' }
   }
   
   const response = await fetch(`/api/admin/employees/${employeeId}`, {
    method: 'PUT',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(data)
   })

   if (response.ok) {
    const result = await response.json()
    setSuccess(`แก้ไขข้อมูลพนักงาน "${data.full_name}" เรียบร้อยแล้ว`)
    
    // Update local employee data
    if (result.employee) {
     setEmployee(result.employee)
    }
    
    // Redirect to employee list after 2 seconds
    setTimeout(() => {
     router.push('/admin/employees')
    }, 2000)
    
    return { success: true }
   } else {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    setError(errorData.error || 'เกิดข้อผิดพลาดในการแก้ไขพนักงาน')
    return { success: false, error: errorData.error }
   }
  } catch (err) {
   console.error('Update employee error:', err)
   const errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'
   setError(errorMessage)
   return { success: false, error: errorMessage }
  }
 }

 const handleCancel = () => {
  router.push('/admin/employees')
 }

 // Show loading spinner while loading data
 if (loading) {
  return (
   <div className="container mx-auto px-4 py-8">
    <div className="flex items-center justify-center min-h-[400px]">
     <div className="text-center">
      <LoadingSpinner className="mx-auto mb-4" />
      <p className="text-gray-600">กำลังโหลดข้อมูลพนักงาน...</p>
     </div>
    </div>
   </div>
  )
 }

 // Show error if failed to load data
 if (error && !employee) {
  return (
   <div className="container mx-auto px-4 py-8">
    <div className="max-w-2xl mx-auto">
     <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
     </Alert>
     
     <div className="mt-6 text-center">
      <button
       onClick={() => router.push('/admin/employees')}
       className="text-blue-600 hover:text-blue-800 underline"
      >
       กลับไปหน้ารายการพนักงาน
      </button>
     </div>
    </div>
   </div>
  )
 }

 if (!employee) {
  return null
 }

 return (
  <div className="container mx-auto px-4 py-8">
   {/* Page Header */}
   <div className="mb-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
     แก้ไขข้อมูลพนักงาน
    </h1>
    <p className="text-gray-600">
     แก้ไขข้อมูลและอัตราค่าแรงของพนักงาน: {employee.full_name}
    </p>
   </div>

   {/* Breadcrumb */}
   <nav className="mb-6" aria-label="Breadcrumb">
    <ol className="flex items-center space-x-2 text-sm">
     <li>
      <button
       onClick={() => router.push('/admin')}
       className="text-blue-600 hover:text-blue-800"
      >
       หน้าแรก
      </button>
     </li>
     <li className="text-gray-500">/</li>
     <li>
      <button
       onClick={() => router.push('/admin/employees')}
       className="text-blue-600 hover:text-blue-800"
      >
       จัดการพนักงาน
      </button>
     </li>
     <li className="text-gray-500">/</li>
     <li className="text-gray-900">แก้ไขพนักงาน</li>
    </ol>
   </nav>

   {/* Employee Info Banner */}
   <div className="mb-6 max-w-2xl mx-auto p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center justify-between">
     <div>
      <h3 className="font-medium text-gray-900">{employee.full_name}</h3>
      <p className="text-sm text-gray-600">
       {employee.email} • สาขา: {employee.branch_name}
      </p>
     </div>
     <div className="text-right">
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
       employee.is_active 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
      }`}>
       {employee.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
      </span>
     </div>
    </div>
   </div>

   {/* Success Message */}
   {success && (
    <div className="mb-6 max-w-2xl mx-auto">
     <Alert className="border-green-200 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
       {success}
      </AlertDescription>
     </Alert>
     <p className="text-center text-sm text-gray-600 mt-2">
      กำลังนำท่านกลับไปหน้ารายการพนักงาน...
     </p>
    </div>
   )}

   {/* Error Message */}
   {error && (
    <div className="mb-6 max-w-2xl mx-auto">
     <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
     </Alert>
    </div>
   )}

   {/* Employee Form */}
   {!success && (
    <EmployeeForm
     mode="edit"
     initialData={employee}
     branches={branches}
     onSubmit={handleSubmit}
     onCancel={handleCancel}
     isLoading={loading}
    />
   )}

   {/* Help Text */}
   {!success && (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-amber-50 rounded-lg">
     <h3 className="font-medium text-amber-900 mb-2">หมายเหตุ:</h3>
     <ul className="text-sm text-amber-800 space-y-1">
      <li>• ไม่สามารถแก้ไขอีเมลและรหัสผ่านได้</li>
      <li>• การเปลี่ยนสาขาหลักจะส่งผลต่อการบันทึกเวลาทำงาน</li>
      <li>• การเปลี่ยนอัตราค่าแรงจะมีผลกับการคำนวณเงินเดือนในอนาคต</li>
      <li>• การปิดใช้งานพนักงานจะทำให้ไม่สามารถเข้าสู่ระบบได้</li>
     </ul>
    </div>
   )}
  </div>
 )
}