'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { validateGPSCoordinates, formatGPSCoordinates } from '@/lib/utils/gps.utils'
import { useForm } from 'react-hook-form'
import type { Database } from '@employee-management/database'

type Branch = Database['public']['Tables']['branches']['Row']

interface BranchFormData {
  name: string
  address: string
  latitude: string
  longitude: string
}

interface BranchFormProps {
  branch?: Branch | null
  onSubmit: (data: BranchFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function BranchForm({ branch, onSubmit, onCancel, isSubmitting = false }: BranchFormProps) {
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const form = useForm<BranchFormData>({
    defaultValues: {
      name: branch?.name || '',
      address: (branch as any)?.address || '',
      latitude: branch?.latitude?.toString() || '',
      longitude: branch?.longitude?.toString() || ''
    }
  })

  const { watch, setValue, handleSubmit, formState: { errors } } = form

  const latitude = watch('latitude')
  const longitude = watch('longitude')

  // Validate GPS coordinates in real-time
  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const validation = validateGPSCoordinates(lat, lng)
        if (!validation.valid) {
          setLocationError(validation.errors.join(', '))
        } else {
          setLocationError(null)
        }
      }
    }
  }, [latitude, longitude])

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('เบราว์เซอร์ไม่รองรับ GPS')
      setIsGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude.toString())
        setValue('longitude', position.coords.longitude.toString())
        setIsGettingLocation(false)
      },
      (error) => {
        let errorMessage: string
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location timeout'
            break
          default:
            errorMessage = 'เกิดข้อผิดพลาดในการค้นหาตำแหน่ง'
            break
        }
        
        setLocationError(errorMessage)
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    )
  }

  const onFormSubmit = async (data: BranchFormData) => {
    // Final validation before submit
    const lat = parseFloat(data.latitude)
    const lng = parseFloat(data.longitude)
    
    if (isNaN(lat) || isNaN(lng)) {
      setLocationError('กรุณากรอกพิกัด GPS ที่ถูกต้อง')
      return
    }

    const validation = validateGPSCoordinates(lat, lng)
    if (!validation.valid) {
      setLocationError(validation.errors.join(', '))
      return
    }

    await onSubmit(data)
  }

  const isEditing = !!branch

  return (
    <Card data-testid={isEditing ? "edit-branch-form" : "add-branch-form"}>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'แก้ไขข้อมูลสาขา' : 'เพิ่มสาขาใหม่'}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? 'แก้ไขข้อมูลสาขาและพิกัด GPS' 
            : 'กรอกข้อมูลสาขาใหม่และพิกัด GPS สำหรับตรวจสอบการลงเวลา'
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
                required: 'กรุณากรอกชื่อสาขา',
                minLength: {
                  value: 2,
                  message: 'ชื่อสาขาต้องมีอย่างน้อย 2 ตัวอักษร'
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อสาขา *</FormLabel>
                  <FormControl>
                    <Input placeholder="เช่น: สาขาใจกลางเมือง" {...field} data-testid="branch-name-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              rules={{
                required: 'กรุณากรอกที่อยู่สาขา',
                minLength: {
                  value: 5,
                  message: 'ที่อยู่สาขาต้องมีอย่างน้อย 5 ตัวอักษร'
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ที่อยู่สาขา *</FormLabel>
                  <FormControl>
                    <Input placeholder="เช่น: 123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพฯ" {...field} data-testid="branch-address-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                rules={{
                  required: 'กรุณากรอกพิกัดละติจูด',
                  validate: (value) => {
                    const num = parseFloat(value)
                    if (isNaN(num)) return 'กรุณากรอกตัวเลขที่ถูกต้อง'
                    if (num < -90 || num > 90) return 'ละติจูดต้องอยู่ระหว่าง -90 ถึง 90'
                    return true
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ละติจูด (Latitude) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
                        placeholder="เช่น: 13.7563"
                        {...field} 
                        data-testid="branch-latitude-input"
                      />
                    </FormControl>
                    <FormDescription>
                      ค่าระหว่าง -90 ถึง 90
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                rules={{
                  required: 'กรุณากรอกพิกัดลองจิจูด',
                  validate: (value) => {
                    const num = parseFloat(value)
                    if (isNaN(num)) return 'กรุณากรอกตัวเลขที่ถูกต้อง'
                    if (num < -180 || num > 180) return 'ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180'
                    return true
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ลองจิจูด (Longitude) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
                        placeholder="เช่น: 100.5018"
                        {...field} 
                        data-testid="branch-longitude-input"
                      />
                    </FormControl>
                    <FormDescription>
                      ค่าระหว่าง -180 ถึง 180
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* GPS Current Location Helper */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">ช่วยเหลือการหาพิกัด</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? 'กำลังค้นหา...' : 'ใช้ตำแหน่งปัจจุบัน'}
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                คลิกเพื่อใช้พิกัด GPS ของตำแหน่งปัจจุบันของคุณ
              </p>
            </div>

            {/* GPS Preview */}
            {latitude && longitude && !locationError && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="text-sm font-medium mb-2">ตัวอย่างพิกัด GPS</h4>
                <p className="text-sm text-gray-700">
                  {formatGPSCoordinates(parseFloat(latitude), parseFloat(longitude))}
                </p>
              </div>
            )}

            {/* Error Display */}
            {locationError && (
              <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                <p className="text-sm text-red-700">{locationError}</p>
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
                disabled={isSubmitting || !!locationError}
                data-testid="submit-branch-btn"
              >
                {isSubmitting ? 'กำลังบันทึก...' : (isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มสาขา')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}