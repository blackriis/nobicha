'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EmployeeForm } from './EmployeeForm'
import { EmployeeFormData } from '@/lib/services/employee.service'
import { branchService } from '@/lib/services/branch.service'
import { employeeService } from '@/lib/services/employee.service'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Branch {
 id: string
 name: string
 address: string
}

export function AddEmployeePage() {
 const router = useRouter()
 const [branches, setBranches] = useState<Branch[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [success, setSuccess] = useState<string | null>(null)

 // Load branches on component mount
 useEffect(() => {
  loadBranches()
 }, [])

 const loadBranches = async () => {
  try {
   setLoading(true)
   setError(null)
   
   // Get all active branches
   const result = await branchService.getAllBranches()
   
   if (!result.success || !result.data || result.data.length === 0) {
    setError(result.error || 'ไม่พบข้อมูลสาขา กรุณาเพิ่มสาขาก่อนสร้างพนักงาน')
    return
   }

   setBranches(result.data)
  } catch (err) {
   console.error('Load branches error:', err)
   setError('เกิดข้อผิดพลาดในการโหลดข้อมูลสาขา')
  } finally {
   setLoading(false)
  }
 }

 const handleSubmit = async (data: EmployeeFormData) => {
  try {
   setError(null)
   setSuccess(null)

   const result = await employeeService.createEmployee(data)
   
   if (result.success) {
    setSuccess(`สร้างพนักงาน "${data.full_name}" เรียบร้อยแล้ว`)
    
    // Redirect to employee list after 2 seconds
    setTimeout(() => {
     router.push('/admin/employees')
    }, 2000)
    
    return { success: true }
   } else {
    setError(result.error || 'เกิดข้อผิดพลาดในการสร้างพนักงาน')
    return { success: false, error: result.error }
   }
  } catch (err) {
   console.error('Create employee error:', err)
   const errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'
   setError(errorMessage)
   return { success: false, error: errorMessage }
  }
 }

 const handleCancel = () => {
  router.push('/admin/employees')
 }

 // Show loading spinner while loading branches
 if (loading) {
  return (
   <div className="container mx-auto px-4 py-8">
    <div className="flex items-center justify-center min-h-[400px]">
     <div className="text-center">
      <LoadingSpinner className="mx-auto mb-4" />
      <p className="text-gray-600">กำลังโหลดข้อมูลสาขา...</p>
     </div>
    </div>
   </div>
  )
 }

 // Show error if failed to load branches
 if (error && branches.length === 0) {
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

 return (
  <div className="container mx-auto px-4 py-8">
   {/* Page Header */}
   <div className="mb-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
     เพิ่มพนักงานใหม่
    </h1>
    <p className="text-gray-600">
     กรอกข้อมูลพนักงานใหม่และกำหนดอัตราค่าแรง
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
     <li className="text-gray-900">เพิ่มพนักงานใหม่</li>
    </ol>
   </nav>

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
     mode="create"
     branches={branches}
     onSubmit={handleSubmit}
     onCancel={handleCancel}
     isLoading={loading}
    />
   )}

   {/* Help Text */}
   {!success && (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-blue-50 rounded-lg">
     <h3 className="font-medium text-blue-900 mb-2">หมายเหตุ:</h3>
     <ul className="text-sm text-blue-800 space-y-1">
      <li>• ระบบจะสร้างบัญชี Supabase Auth และข้อมูลพนักงานพร้อมกัน</li>
      <li>• รหัสผ่านต้องมีความแข็งแรงตามมาตรฐาน</li>
      <li>• อีเมลต้องไม่ซ้ำกับพนักงานคนอื่น</li>
      <li>• อัตราค่าแรงสามารถแก้ไขได้ในภายหลัง</li>
     </ul>
    </div>
   )}
  </div>
 )
}