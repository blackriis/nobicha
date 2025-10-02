'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal,
  ArrowUpDown,
  Edit,
  Eye,
  Trash2,
  User,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { EmployeeListItem, SearchFilters } from '@/lib/services/employee.service'

interface EmployeeTableProps {
  employees: EmployeeListItem[]
  loading: boolean
  onSort: (field: SearchFilters['sortBy']) => void
  sortBy: SearchFilters['sortBy']
  sortOrder: SearchFilters['sortOrder']
}

export function EmployeeTable({ 
  employees, 
  loading, 
  onSort, 
  sortBy, 
  sortOrder 
}: EmployeeTableProps) {
  const router = useRouter()
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="default" className="bg-primary hover:bg-primary/90">
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

  const getSortIcon = (field: SearchFilters['sortBy']) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />
  }

  // Navigation handlers
  const handleEditEmployee = (employeeId: string) => {
    router.push(`/admin/employees/${employeeId}/edit`)
  }

  const handleViewEmployee = (employeeId: string) => {
    router.push(`/admin/employees/${employeeId}`)
  }

  if (loading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ-สกุล</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>สาขาหลัก</TableHead>
              <TableHead>บทบาท</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>วันที่สร้าง</TableHead>
              <TableHead className="w-[100px]">การจัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-8 bg-gray-200 rounded w-8 animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ไม่พบข้อมูลพนักงาน
        </h3>
        <p className="text-gray-600 mb-4">
          ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองข้อมูล
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => onSort('full_name')}
                className="h-auto p-0 font-medium"
              >
                ชื่อ-สกุล
                {getSortIcon('full_name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => onSort('email')}
                className="h-auto p-0 font-medium"
              >
                อีเมล
                {getSortIcon('email')}
              </Button>
            </TableHead>
            <TableHead>สาขาหลัก</TableHead>
            <TableHead>บทบาท</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => onSort('created_at')}
                className="h-auto p-0 font-medium"
              >
                วันที่สร้าง
                {getSortIcon('created_at')}
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">การจัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{employee.full_name}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-gray-600">
                {employee.email}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {employee.branch_name || 'ไม่ระบุ'}
                </div>
              </TableCell>
              <TableCell>
                {getRoleBadge(employee.role)}
              </TableCell>
              <TableCell>
                {getStatusBadge(employee.is_active)}
              </TableCell>
              <TableCell className="text-gray-600">
                {formatDate(employee.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewEmployee(employee.id)}
                    title="ดูรายละเอียด"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditEmployee(employee.id)}
                    title="แก้ไขข้อมูล"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    title="ตัวเลือกเพิ่มเติม"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}