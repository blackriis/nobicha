'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
 MoreHorizontal,
 Clock,
 MapPin,
 Mail,
 Phone,
 Calendar,
 Edit,
 Trash2,
 Eye,
 CheckCircle2,
 XCircle,
 AlertCircle,
 User
} from 'lucide-react'
import Link from 'next/link'

interface Employee {
 id: string
 name: string
 email: string
 phone?: string
 employee_code: string
 role: 'employee' | 'admin'
 status: 'active' | 'inactive'
 branch?: string
 position?: string
 hire_date: string
 last_check_in?: string
 profile_picture?: string
 is_currently_working: boolean
 total_hours_this_month: number
 attendance_rate: number
}

interface EmployeeListProps {
 searchTerm: string
 filterStatus: 'all' | 'active' | 'inactive' | 'on-shift'
}

export function EmployeeList({ searchTerm, filterStatus }: EmployeeListProps) {
 const [employees, setEmployees] = useState<Employee[]>([])
 const [loading, setLoading] = useState(true)

 // Mock data - จะเชื่อมกับ API จริงในภายหลัง
 useEffect(() => {
  const mockEmployees: Employee[] = [
   {
    id: '1',
    name: 'สมชาย ใจดี',
    email: 'somchai@company.com',
    phone: '081-234-5678',
    employee_code: 'EMP001',
    role: 'employee',
    status: 'active',
    branch: 'สาขาสีลม',
    position: 'พนักงานขาย',
    hire_date: '2024-01-15',
    last_check_in: '2024-01-15T08:30:00Z',
    is_currently_working: true,
    total_hours_this_month: 168,
    attendance_rate: 95
   },
   {
    id: '2',
    name: 'สมหญิง รักงาน',
    email: 'somying@company.com',
    phone: '082-345-6789',
    employee_code: 'EMP002',
    role: 'employee',
    status: 'active',
    branch: 'สาขาสุขุมวิท',
    position: 'พนักงานบัญชี',
    hire_date: '2023-08-20',
    last_check_in: '2024-01-15T09:15:00Z',
    is_currently_working: false,
    total_hours_this_month: 160,
    attendance_rate: 88
   },
   {
    id: '3',
    name: 'วิชัย กิจหนัก',
    email: 'wichai@company.com',
    phone: '083-456-7890',
    employee_code: 'EMP003',
    role: 'admin',
    status: 'active',
    branch: 'สำนักงานใหญ่',
    position: 'ผู้จัดการสาขา',
    hire_date: '2022-03-10',
    last_check_in: '2024-01-15T07:45:00Z',
    is_currently_working: true,
    total_hours_this_month: 180,
    attendance_rate: 98
   },
   {
    id: '4',
    name: 'มาลี สวยงาม',
    email: 'malee@company.com',
    phone: '084-567-8901',
    employee_code: 'EMP004',
    role: 'employee',
    status: 'inactive',
    branch: 'สาขาพระราม 4',
    position: 'พนักงานการตลาด',
    hire_date: '2023-11-05',
    is_currently_working: false,
    total_hours_this_month: 0,
    attendance_rate: 0
   },
   {
    id: '5',
    name: 'ธนา วิ่งเร็ว',
    email: 'thana@company.com',
    phone: '085-678-9012',
    employee_code: 'EMP005',
    role: 'employee',
    status: 'active',
    branch: 'สาขาลาดพร้าว',
    position: 'พนักงานจัดส่ง',
    hire_date: '2024-01-02',
    last_check_in: '2024-01-15T10:00:00Z',
    is_currently_working: true,
    total_hours_this_month: 120,
    attendance_rate: 92
   }
  ]

  // Simulate API call
  setTimeout(() => {
   setEmployees(mockEmployees)
   setLoading(false)
  }, 1000)
 }, [])

 const filteredEmployees = employees.filter(employee => {
  // Search filter
  const matchesSearch = searchTerm === '' || 
   employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
   employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
   employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase())

  // Status filter
  const matchesStatus = 
   filterStatus === 'all' ||
   (filterStatus === 'active' && employee.status === 'active') ||
   (filterStatus === 'inactive' && employee.status === 'inactive') ||
   (filterStatus === 'on-shift' && employee.is_currently_working)

  return matchesSearch && matchesStatus
 })

 const getStatusBadge = (employee: Employee) => {
  if (employee.status === 'inactive') {
   return <Badge variant="destructive" className="flex items-center gap-1">
    <XCircle className="h-3 w-3" />
    ไม่ใช้งาน
   </Badge>
  }
  
  if (employee.is_currently_working) {
   return <Badge variant="default" className="bg-primary text-primary-foreground flex items-center gap-1">
    <Clock className="h-3 w-3" />
    กำลังทำงาน
   </Badge>
  }
  
  return <Badge variant="secondary" className="flex items-center gap-1">
   <CheckCircle2 className="h-3 w-3" />
   ใช้งานอยู่
  </Badge>
 }

 const getAttendanceColor = (rate: number) => {
  if (rate >= 95) return 'text-green-600'
  if (rate >= 80) return 'text-yellow-600' 
  return 'text-destructive'
 }

 const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
   year: 'numeric',
   month: 'long',
   day: 'numeric'
  })
 }

 const formatLastCheckIn = (dateString?: string) => {
  if (!dateString) return 'ไม่มีข้อมูล'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
   const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
   return `${diffInMinutes} นาทีที่แล้ว`
  }
  
  if (diffInHours < 24) {
   return `${diffInHours} ชั่วโมงที่แล้ว`
  }
  
  return date.toLocaleDateString('th-TH')
 }

 if (loading) {
  return (
   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
     <Card key={i}>
      <CardHeader>
       <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
         <Skeleton className="rounded-full h-12 w-12" />
         <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-2">
           <Skeleton className="h-3 w-16" />
           <Skeleton className="h-3 w-20" />
          </div>
         </div>
        </div>
        <div className="flex items-center space-x-2">
         <Skeleton className="h-6 w-20" />
         <Skeleton className="h-8 w-8" />
        </div>
       </div>
      </CardHeader>
      <CardContent className="space-y-4">
       {/* Contact Information Skeleton */}
       <div className="space-y-2">
        <div className="flex items-center">
         <Skeleton className="h-4 w-4 mr-2" />
         <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex items-center">
         <Skeleton className="h-4 w-4 mr-2" />
         <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex items-center">
         <Skeleton className="h-4 w-4 mr-2" />
         <Skeleton className="h-3 w-36" />
        </div>
       </div>

       {/* Work Statistics Skeleton */}
       <div className="border-t pt-3 space-y-2">
        {[...Array(4)].map((_, j) => (
         <div key={j} className="flex justify-between items-center">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
         </div>
        ))}
       </div>

       {/* Action Buttons Skeleton */}
       <div className="border-t pt-3 flex space-x-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-10" />
       </div>
      </CardContent>
     </Card>
    ))}
   </div>
  )
 }

 if (filteredEmployees.length === 0) {
  return (
   <Card className="text-center py-12">
    <CardContent>
     <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
     <h3 className="text-lg font-medium text-foreground mb-2">ไม่พบข้อมูลพนักงาน</h3>
     <p className="text-muted-foreground mb-4">
      {searchTerm || filterStatus !== 'all' 
       ? 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองข้อมูล'
       : 'ยังไม่มีพนักงานในระบบ เริ่มต้นด้วยการเพิ่มพนักงานคนแรก'
      }
     </p>
     {(!searchTerm && filterStatus === 'all') && (
      <Button>
       <User className="h-4 w-4 mr-2" />
       เพิ่มพนักงานใหม่
      </Button>
     )}
    </CardContent>
   </Card>
  )
 }

 return (
  <div className="space-y-6">
   <div className="flex items-center justify-between">
    <p className="text-sm text-muted-foreground">
     แสดง {filteredEmployees.length} จาก {employees.length} คน
    </p>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {filteredEmployees.map((employee) => (
     <Card key={employee.id} className="hover: ">
      <CardHeader>
       <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
         <div className="rounded-full bg-primary/10 p-2">
          <User className="h-6 w-6 text-primary" />
         </div>
         <div>
          <CardTitle className="text-lg">{employee.name}</CardTitle>
          <CardDescription className="flex items-center gap-2">
           <Badge variant="outline" className="text-xs">
            {employee.employee_code}
           </Badge>
           {employee.position && (
            <span className="text-sm text-muted-foreground">{employee.position}</span>
           )}
          </CardDescription>
         </div>
        </div>
        <div className="flex items-center space-x-2">
         {getStatusBadge(employee)}
         <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
         </Button>
        </div>
       </div>
      </CardHeader>

      <CardContent className="space-y-4">
       {/* Contact Information */}
       <div className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
         <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
         <span className="truncate">{employee.email}</span>
        </div>
        {employee.phone && (
         <div className="flex items-center text-sm text-muted-foreground">
          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{employee.phone}</span>
         </div>
        )}
        {employee.branch && (
         <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{employee.branch}</span>
         </div>
        )}
       </div>

       {/* Work Statistics */}
       <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between items-center text-sm">
         <span className="text-muted-foreground">วันที่เข้าทำงาน:</span>
         <span className="font-medium">{formatDate(employee.hire_date)}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
         <span className="text-muted-foreground">เช็คอินล่าสุด:</span>
         <span className="font-medium">{formatLastCheckIn(employee.last_check_in)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
         <span className="text-muted-foreground">ชั่วโมงเดือนนี้:</span>
         <span className="font-medium">{employee.total_hours_this_month} ชม.</span>
        </div>

        <div className="flex justify-between items-center text-sm">
         <span className="text-muted-foreground">อัตราการเข้างาน:</span>
         <span className={`font-medium ${getAttendanceColor(employee.attendance_rate)}`}>
          {employee.attendance_rate}%
         </span>
        </div>
       </div>

       {/* Action Buttons */}
       <div className="border-t pt-3 flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
         <Eye className="h-4 w-4 mr-1" />
         ดูรายละเอียด
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
         <Edit className="h-4 w-4 mr-1" />
         แก้ไข
        </Button>
        <Button variant="outline" size="sm" className="px-2">
         <Trash2 className="h-4 w-4" />
        </Button>
       </div>
      </CardContent>
     </Card>
    ))}
   </div>
  </div>
 )
}