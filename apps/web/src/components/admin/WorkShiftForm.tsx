'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import type { Database } from '@employee-management/database'

type WorkShift = Database['public']['Tables']['work_shifts']['Row']

interface WorkShiftFormData {
  name: string
  start_time: string
  end_time: string
  days_of_week: number[]
}

interface WorkShiftFormProps {
  branchId: string
  branchName: string
  shift?: WorkShift | null
  onSubmit: (data: WorkShiftFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function WorkShiftForm({ 
  branchId, 
  branchName, 
  shift, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: WorkShiftFormProps) {
  const [timeError, setTimeError] = useState<string | null>(null)

  const form = useForm<WorkShiftFormData>({
    defaultValues: {
      name: shift?.shift_name || '',
      start_time: shift?.start_time || '',
      end_time: shift?.end_time || '17:00',
      days_of_week: shift?.days_of_week || [1, 2, 3, 4, 5]
    }
  })

  const { handleSubmit, watch } = form
  const startTime = watch('start_time')

  // Validate time format
  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  const onFormSubmit = async (data: WorkShiftFormData) => {
    setTimeError(null)

    // Validate time format
    if (!validateTimeFormat(data.start_time)) {
      setTimeError('กรุณากรอกเวลาในรูปแบบ HH:MM (เช่น: 08:00)')
      return
    }

    await onSubmit(data)
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(timeStr)
      }
    }
    return options
  }

  const isEditing = !!shift

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'แก้ไขกะการทำงาน' : 'เพิ่มกะการทำงานใหม่'}
        </CardTitle>
        <CardDescription>
          สาขา: {branchName}
          {isEditing 
            ? ' - แก้ไขข้อมูลกะการทำงาน' 
            : ' - เพิ่มกะการทำงานใหม่สำหรับสาขานี้'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              rules={{
                required: 'กรุณากรอกชื่อกะการทำงาน',
                minLength: {
                  value: 2,
                  message: 'ชื่อกะต้องมีอย่างน้อย 2 ตัวอักษร'
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อกะการทำงาน *</FormLabel>
                  <FormControl>
                    <Input placeholder="เช่น: กะเช้า, กะบ่าย, กะดึก" {...field} />
                  </FormControl>
                  <FormDescription>
                    ชื่อกะที่ใช้เรียกและแสดงในระบบ
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_time"
              rules={{
                required: 'กรุณากรอกเวลาเริ่มงาน',
                validate: (value) => {
                  if (!validateTimeFormat(value)) {
                    return 'กรุณากรอกเวลาในรูปแบบ HH:MM'
                  }
                  return true
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เวลาเริ่มงาน *</FormLabel>
                  <FormControl>
                    <Input 
                      type="time"
                      placeholder="08:00"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    เวลาเริ่มต้นของกะการทำงาน (รูปแบบ 24 ชั่วโมง)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              rules={{
                required: 'กรุณากรอกเวลาสิ้นสุดงาน',
                validate: (value) => {
                  if (!validateTimeFormat(value)) {
                    return 'กรุณากรอกเวลาในรูปแบบ HH:MM'
                  }
                  return true
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เวลาสิ้นสุดงาน *</FormLabel>
                  <FormControl>
                    <Input 
                      type="time"
                      placeholder="17:00"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    เวลาสิ้นสุดของกะการทำงาน (รูปแบบ 24 ชั่วโมง)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="days_of_week"
              rules={{
                required: 'กรุณาเลือกวันทำงาน',
                validate: (value) => {
                  if (!value || value.length === 0) {
                    return 'กรุณาเลือกวันทำงานอย่างน้อย 1 วัน'
                  }
                  return true
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>วันทำงาน *</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        { value: 1, label: 'จ' },
                        { value: 2, label: 'อ' },
                        { value: 3, label: 'พ' },
                        { value: 4, label: 'พฤ' },
                        { value: 5, label: 'ศ' },
                        { value: 6, label: 'ส' },
                        { value: 0, label: 'อา' }
                      ].map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={field.value?.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const currentDays = field.value || []
                            if (currentDays.includes(day.value)) {
                              field.onChange(currentDays.filter(d => d !== day.value))
                            } else {
                              field.onChange([...currentDays, day.value])
                            }
                          }}
                          className="aspect-square"
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    เลือกวันทำงานของกะนี้
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Common Time Suggestions */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium mb-3">เวลาทั่วไป</h4>
              <div className="grid grid-cols-4 gap-2">
                {['06:00', '08:00', '09:00', '14:00', '16:00', '18:00', '22:00', '00:00'].map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('start_time', time)}
                    className="text-xs"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Preview */}
            {startTime && validateTimeFormat(startTime) && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="text-sm font-medium mb-2">ตัวอย่าง</h4>
                <p className="text-sm text-gray-700">
                  กะ "{form.watch('name') || 'ไม่ระบุชื่อ'}" เริ่มงานเวลา {startTime} น.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ระบบจะแสดงเวลาในรูปแบบ 12 ชั่วโมง: {
                    new Date(`2000-01-01T${startTime}`).toLocaleTimeString('th-TH', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                  }
                </p>
              </div>
            )}

            {/* Error Display */}
            {timeError && (
              <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                <p className="text-sm text-red-700">{timeError}</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !!timeError}
              >
                {isSubmitting ? 'กำลังบันทึก...' : (isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มกะงาน')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}