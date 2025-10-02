'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PayrollService, CreatePayrollCycleData } from '../services/payroll.service'
import { validateDateRange, generatePayrollCycleName, formatDateForInput } from '../utils/payroll-calculation.utils'

interface CreatePayrollCycleProps {
  onSuccess?: (cycleId: string) => void;
  onCancel?: () => void;
}

export default function CreatePayrollCycle({ onSuccess, onCancel }: CreatePayrollCycleProps) {
  const [formData, setFormData] = useState<CreatePayrollCycleData>({
    name: '',
    start_date: '',
    end_date: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof CreatePayrollCycleData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific error
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Auto-generate name if dates are provided
    if ((field === 'start_date' || field === 'end_date') && !formData.name.trim()) {
      const startDate = field === 'start_date' ? value : formData.start_date
      const endDate = field === 'end_date' ? value : formData.end_date
      
      if (startDate && endDate) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          name: generatePayrollCycleName(startDate, endDate)
        }))
      }
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'กรุณากรอกชื่อรอบการจ่ายเงินเดือน'
    }
    
    if (!formData.start_date) {
      errors.start_date = 'กรุณาเลือกวันที่เริ่มต้น'
    }
    
    if (!formData.end_date) {
      errors.end_date = 'กรุณาเลือกวันที่สิ้นสุด'
    }
    
    if (formData.start_date && formData.end_date) {
      const dateValidation = validateDateRange(formData.start_date, formData.end_date)
      if (!dateValidation.isValid) {
        errors.date_range = dateValidation.error || 'ช่วงวันที่ไม่ถูกต้อง'
      }
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await PayrollService.createPayrollCycle(formData)
      
      if (result.success) {
        // Reset form
        setFormData({ name: '', start_date: '', end_date: '' })
        setFieldErrors({})
        
        // Call success callback
        onSuccess?.(result.data.payroll_cycle.id)
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการสร้างรอบการจ่ายเงินเดือน')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด')
      console.error('Create payroll cycle error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateName = () => {
    if (formData.start_date && formData.end_date) {
      const generatedName = generatePayrollCycleName(formData.start_date, formData.end_date)
      setFormData(prev => ({ ...prev, name: generatedName }))
    }
  }

  const getTodayDate = () => {
    return formatDateForInput(new Date())
  }

  const getNextMonthDate = () => {
    const date = new Date()
    date.setMonth(date.getMonth() + 1)
    date.setDate(0) // Last day of current month + 1 month = last day of next month
    return formatDateForInput(date)
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">สร้างรอบการจ่ายเงินเดือนใหม่</h3>
        <p className="text-sm text-gray-600 mt-1">
          กำหนดช่วงเวลาสำหรับการคำนวณเงินเดือนพนักงาน
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">วันที่เริ่มต้น *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              max={formData.end_date || undefined}
              className={fieldErrors.start_date ? 'border-red-500' : ''}
            />
            {fieldErrors.start_date && (
              <p className="text-sm text-red-600">{fieldErrors.start_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">วันที่สิ้นสุด *</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              min={formData.start_date || undefined}
              className={fieldErrors.end_date ? 'border-red-500' : ''}
            />
            {fieldErrors.end_date && (
              <p className="text-sm text-red-600">{fieldErrors.end_date}</p>
            )}
          </div>
        </div>

        {fieldErrors.date_range && (
          <p className="text-sm text-red-600">{fieldErrors.date_range}</p>
        )}

        {/* Quick Date Presets */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const today = getTodayDate()
              const nextMonth = getNextMonthDate()
              setFormData(prev => ({ 
                ...prev, 
                start_date: today, 
                end_date: nextMonth,
                name: generatePayrollCycleName(today, nextMonth)
              }))
            }}
            className="text-xs"
          >
            เดือนปัจจุบัน
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const firstOfMonth = formatDateForInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
              const lastOfMonth = formatDateForInput(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
              setFormData(prev => ({ 
                ...prev, 
                start_date: firstOfMonth, 
                end_date: lastOfMonth,
                name: generatePayrollCycleName(firstOfMonth, lastOfMonth)
              }))
            }}
            className="text-xs"
          >
            ทั้งเดือน
          </Button>
        </div>

        {/* Cycle Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="name">ชื่อรอบการจ่ายเงินเดือน *</Label>
            {formData.start_date && formData.end_date && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleGenerateName}
                className="text-xs h-auto p-0"
              >
                สร้างชื่ออัตโนมัติ
              </Button>
            )}
          </div>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="เช่น เงินเดือนมกราคม 2568"
            className={fieldErrors.name ? 'border-red-500' : ''}
          />
          {fieldErrors.name && (
            <p className="text-sm text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? 'กำลังสร้าง...' : 'สร้างรอบ'}
          </Button>
        </div>
      </form>
    </Card>
  )
}