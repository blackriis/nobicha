'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmployeeFormData, EmployeeUpdateData, EmployeeDetail } from '@/lib/services/employee.service'

// Form validation schema
const employeeSchema = z.object({
  full_name: z.string()
    .min(2, 'ชื่อ-สกุลต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(100, 'ชื่อ-สกุลต้องไม่เกิน 100 ตัวอักษร'),
  email: z.string()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .min(1, 'อีเมลเป็นข้อมูลที่จำเป็น'),
  password: z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/(?=.*[a-z])/, 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/(?=.*[A-Z])/, 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/(?=.*\d)/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .optional(),
  home_branch_id: z.string()
    .min(1, 'กรุณาเลือกสาขาหลัก'),
  hourly_rate: z.number()
    .min(0, 'อัตราค่าแรงรายชั่วโมงต้องมากกว่าหรือเท่ากับ 0')
    .max(10000, 'อัตราค่าแรงรายชั่วโมงต้องไม่เกิน 10,000 บาท'),
  daily_rate: z.number()
    .min(0, 'อัตราค่าแรงรายวันต้องมากกว่าหรือเท่ากับ 0')
    .max(50000, 'อัตราค่าแรงรายวันต้องไม่เกิน 50,000 บาท'),
  is_active: z.boolean().optional()
})

const employeeUpdateSchema = employeeSchema.omit({ password: true })

interface Branch {
  id: string
  name: string
  address: string
}

interface EmployeeFormProps {
  mode: 'create' | 'edit'
  initialData?: EmployeeDetail
  branches: Branch[]
  onSubmit: (data: EmployeeFormData | EmployeeUpdateData) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  isLoading?: boolean
}

export function EmployeeForm({ 
  mode, 
  initialData, 
  branches, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: EmployeeFormProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [formData, setFormData] = useState<EmployeeFormData | EmployeeUpdateData | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  const isCreateMode = mode === 'create'
  const schema = isCreateMode ? employeeSchema : employeeUpdateSchema

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      email: initialData?.email || '',
      password: '',
      home_branch_id: initialData?.home_branch_id || '',
      hourly_rate: initialData?.hourly_rate || 0,
      daily_rate: initialData?.daily_rate || 0,
      is_active: initialData?.is_active ?? true
    },
    mode: 'onChange'
  })

  const watchedValues = watch()
  
  // Handle form submission
  const handleFormSubmit = (data: any) => {
    const submitData = isCreateMode 
      ? {
          ...data,
          user_role: 'employee' as const,
          hourly_rate: Number(data.hourly_rate),
          daily_rate: Number(data.daily_rate)
        }
      : {
          full_name: data.full_name,
          email: data.email,
          home_branch_id: data.home_branch_id,
          hourly_rate: Number(data.hourly_rate),
          daily_rate: Number(data.daily_rate),
          is_active: data.is_active
        }

    setFormData(submitData)
    setShowConfirmDialog(true)
  }

  // Handle confirmed submission
  const handleConfirmedSubmit = async () => {
    if (!formData) return

    setSubmitLoading(true)
    setShowConfirmDialog(false)

    try {
      const result = await onSubmit(formData)
      if (result.success) {
        // Success will be handled by parent component
      } else {
        console.error('Form submission error:', result.error)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {isCreateMode ? 'เพิ่มพนักงานใหม่' : 'แก้ไขข้อมูลพนักงาน'}
          </CardTitle>
          <CardDescription>
            {isCreateMode 
              ? 'กรอกข้อมูลพนักงานใหม่และกำหนดอัตราค่าแรง'
              : 'แก้ไขข้อมูลพนักงานและอัตราค่าแรง (ไม่สามารถแก้ไขอีเมลและรหัสผ่านได้)'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">ข้อมูลส่วนตัว</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">ชื่อ-สกุล *</Label>
                  <Input
                    id="full_name"
                    {...register('full_name')}
                    placeholder="ชื่อ สกุล"
                    disabled={isLoading || submitLoading}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="email@example.com"
                    disabled={isLoading || submitLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Password (Create mode only) */}
              {isCreateMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    disabled={isLoading || submitLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข
                  </p>
                </div>
              )}

              {/* Email display (Edit mode only) */}
              {!isCreateMode && initialData && (
                <div className="space-y-2">
                  <Label>อีเมล</Label>
                  <Input
                    value={initialData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500">
                    ไม่สามารถแก้ไขอีเมลได้
                  </p>
                </div>
              )}
            </div>

            {/* Work Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">ข้อมูลการทำงาน</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Branch Selection */}
                <div className="space-y-2">
                  <Label htmlFor="home_branch_id">สาขาหลัก *</Label>
                  <Select
                    value={watchedValues.home_branch_id}
                    onValueChange={(value) => setValue('home_branch_id', value)}
                    disabled={isLoading || submitLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสาขา" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} - {branch.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.home_branch_id && (
                    <p className="text-sm text-red-600">{errors.home_branch_id.message}</p>
                  )}
                </div>

                {/* Active Status (Edit mode only) */}
                {!isCreateMode && (
                  <div className="space-y-2">
                    <Label htmlFor="is_active">สถานะ</Label>
                    <Select
                      value={watchedValues.is_active ? 'true' : 'false'}
                      onValueChange={(value) => setValue('is_active', value === 'true')}
                      disabled={isLoading || submitLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">ใช้งาน</SelectItem>
                        <SelectItem value="false">ไม่ใช้งาน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">อัตราค่าแรงรายชั่วโมง (บาท) *</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10000"
                    {...register('hourly_rate', { valueAsNumber: true })}
                    placeholder="0.00"
                    disabled={isLoading || submitLoading}
                  />
                  {errors.hourly_rate && (
                    <p className="text-sm text-red-600">{errors.hourly_rate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily_rate">อัตราค่าแรงรายวัน (บาท) *</Label>
                  <Input
                    id="daily_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="50000"
                    {...register('daily_rate', { valueAsNumber: true })}
                    placeholder="0.00"
                    disabled={isLoading || submitLoading}
                  />
                  {errors.daily_rate && (
                    <p className="text-sm text-red-600">{errors.daily_rate.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={!isValid || isLoading || submitLoading}
                className="flex-1"
              >
                {submitLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                {isCreateMode ? 'สร้างพนักงาน' : 'บันทึกการแก้ไข'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || submitLoading}
                className="flex-1"
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ยืนยันการ{isCreateMode ? 'สร้าง' : 'แก้ไข'}พนักงาน
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isCreateMode 
                ? `คุณต้องการสร้างพนักงานใหม่ "${formData?.full_name}" หรือไม่?`
                : `คุณต้องการบันทึกการแก้ไขข้อมูลพนักงาน "${formData?.full_name}" หรือไม่?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitLoading}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedSubmit}
              disabled={submitLoading}
            >
              {submitLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}