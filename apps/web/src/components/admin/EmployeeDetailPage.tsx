'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { isValidUUID } from '@/lib/validation'
import { 
  ArrowLeft,
  User,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Edit
} from 'lucide-react'
import { employeeService, EmployeeDetail } from '@/lib/services/employee.service'
import { TimeEntryList } from '@/components/admin/TimeEntryList'

interface EmployeeDetailPageProps {
  employeeId: string
}

export function EmployeeDetailPage({ employeeId }: EmployeeDetailPageProps) {
  const router = useRouter()
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEmployeeData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Validate employee ID format (UUID)
      if (!isValidUUID(employeeId)) {
        throw new Error('รหัสพนักงานไม่ถูกต้อง')
      }
      
      const employeeData = await employeeService.getEmployeeById(employeeId)
      setEmployee(employeeData)
    } catch (err) {
      console.error('Load employee data error:', err)
      
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes('Cannot coerce the result to a single JSON object') || 
            err.message.includes('The result contains 0 rows')) {
          setError(`ไม่พบข้อมูลพนักงาน (ID: ${employeeId}) - อาจเป็นเพราะ:
• พนักงานรายนี้ไม่มีอยู่ในระบบ
• ไม่มีสิทธิ์เข้าถึงข้อมูลพนักงานรายนี้
• ข้อมูลถูกลบหรือปิดใช้งาน`)
        } else if (err.message.includes('รหัสพนักงานไม่ถูกต้อง')) {
          setError('รหัสพนักงานไม่ถูกต้อง กรุณาตรวจสอบ URL')
        } else if (err.message.includes('Employee not found')) {
          setError(`ไม่พบข้อมูลพนักงาน (ID: ${employeeId})`)
        } else {
          setError(`เกิดข้อผิดพลาด: ${err.message}`)
        }
      } else {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน')
      }
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  // Load employee data on component mount
  useEffect(() => {
    if (employeeId) {
      loadEmployeeData()
    }
  }, [employeeId, loadEmployeeData])

  const handleBack = () => {
    router.push('/admin/employees')
  }

  const handleEdit = () => {
    router.push(`/admin/employees/${employeeId}/edit`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          ใช้งานอยู่
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        ไม่ใช้งาน
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          ผู้ดูแลระบบ
        </Badge>
      )
    }
    return (
      <Badge variant="outline">
        พนักงาน
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูลพนักงาน...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>กลับ</span>
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium">⚠️ เกิดข้อผิดพลาด:</span>
              </div>
              <p className="text-sm">{error}</p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEmployeeData}
                >
                  ลองใหม่
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                >
                  กลับไปรายการพนักงาน
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>กลับ</span>
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            ไม่พบข้อมูลพนักงานรายการนี้
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>กลับ</span>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              รายละเอียดพนักงาน
            </h1>
            <p className="text-gray-600">
              ข้อมูลพนักงานและการมาทำงาน
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>แก้ไขข้อมูล</span>
          </Button>
        </div>
      </div>

      {/* Employee Information Accordion */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={["employee-info", "time-entries"]} className="w-full">
            <AccordionItem value="employee-info" className="border-b-0">
              <AccordionTrigger className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="text-lg font-semibold">ข้อมูลพนักงาน</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ชื่อ-สกุล</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {employee.full_name}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">อีเมล</label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{employee.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">สาขา</label>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">
                          {employee.branch_name || 'ไม่ระบุ'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Role */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">สถานะ</label>
                      <div className="mt-1">
                        {getStatusBadge(employee.is_active)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">บทบาท</label>
                      <div className="mt-1">
                        {getRoleBadge(employee.role)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">วันที่สร้างบัญชี</label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">
                          {formatDate(employee.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="time-entries">
              <AccordionTrigger className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-lg font-semibold">ประวัติการมาทำงาน</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <TimeEntryList employeeId={employeeId} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
