'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import { Filter, X, Users, Building2 } from 'lucide-react'

interface Branch {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  created_at: string
}

interface EmployeeFiltersProps {
 filters: {
  role?: 'employee' | 'admin'
  status?: 'active' | 'inactive'
  branchId?: string
 }
 onFilterChange: (filters: {
  role?: 'employee' | 'admin'
  status?: 'active' | 'inactive'
  branchId?: string
 }) => void
}

export function EmployeeFilters({ filters, onFilterChange }: EmployeeFiltersProps) {
 const [branches, setBranches] = useState<Branch[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  loadBranches()
 }, [])

 const loadBranches = async () => {
  try {
   setLoading(true)
   const response = await fetch('/api/admin/branches', {
    credentials: 'include',
    headers: {
     'Content-Type': 'application/json'
    }
   })

   if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
   }

   const result = await response.json()
   
   if (result.success && result.branches) {
    setBranches(result.branches)
   } else {
    throw new Error('Invalid response format')
   }
  } catch (error) {
   console.error('Failed to load branches:', error)
   setBranches([])
  } finally {
   setLoading(false)
  }
 }

 const handleRoleChange = (value: string) => {
  const role = value === 'all' ? undefined : value as 'employee' | 'admin'
  onFilterChange({ ...filters, role })
 }

 const handleStatusChange = (value: string) => {
  const status = value === 'all' ? undefined : value as 'active' | 'inactive'
  onFilterChange({ ...filters, status })
 }

 const handleBranchChange = (value: string) => {
  const branchId = value === 'all' ? undefined : value
  onFilterChange({ ...filters, branchId })
 }

 const clearAllFilters = () => {
  onFilterChange({})
 }

 const hasActiveFilters = filters.role || filters.status || filters.branchId

 return (
  <div className="space-y-4">
   {/* Filter Controls */}
   <div className="flex flex-wrap gap-3">
    <div className="flex items-center gap-2">
     <Filter className="h-4 w-4 text-gray-500" />
     <span className="text-sm font-medium text-gray-700">กรองข้อมูล:</span>
    </div>

    {/* Role Filter */}
    <Select 
     value={filters.role || 'all'} 
     onValueChange={handleRoleChange}
    >
     <SelectTrigger className="w-[140px]">
      <Users className="h-4 w-4 mr-2" />
      <SelectValue placeholder="บทบาท" />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value="all">ทุกบทบาท</SelectItem>
      <SelectItem value="employee">พนักงาน</SelectItem>
      <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
     </SelectContent>
    </Select>

    {/* Status Filter */}
    <Select 
     value={filters.status || 'all'} 
     onValueChange={handleStatusChange}
    >
     <SelectTrigger className="w-[140px]">
      <SelectValue placeholder="สถานะ" />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value="all">ทุกสถานะ</SelectItem>
      <SelectItem value="active">ใช้งานอยู่</SelectItem>
      <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
     </SelectContent>
    </Select>

    {/* Branch Filter */}
    <Select 
     value={filters.branchId || 'all'} 
     onValueChange={handleBranchChange}
     disabled={loading}
    >
     <SelectTrigger className="w-[160px]">
      <Building2 className="h-4 w-4 mr-2" />
      <SelectValue placeholder={loading ? "กำลังโหลด..." : "สาขา"} />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value="all">ทุกสาขา</SelectItem>
      {Array.isArray(branches) && branches.map((branch) => (
       <SelectItem key={branch.id} value={branch.id}>
        {branch.name}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>

    {/* Clear Filters Button */}
    {hasActiveFilters && (
     <Button
      variant="outline"
      size="sm"
      onClick={clearAllFilters}
      className="text-gray-600 hover:text-gray-800"
     >
      <X className="h-4 w-4 mr-1" />
      ล้างตัวกรอง
     </Button>
    )}
   </div>

   {/* Active Filters Display */}
   {hasActiveFilters && (
    <div className="flex items-center gap-2 pt-2 border-t">
     <span className="text-sm text-gray-600">กรองแล้ว:</span>
     
     {filters.role && (
      <Badge variant="secondary" className="flex items-center gap-1">
       บทบาท: {filters.role === 'employee' ? 'พนักงาน' : 'ผู้ดูแลระบบ'}
       <button
        onClick={() => onFilterChange({ ...filters, role: undefined })}
        className="ml-1 hover:text-red-600"
        aria-label="ยกเลิกการกรองบทบาท"
       >
        ×
       </button>
      </Badge>
     )}
     
     {filters.status && (
      <Badge variant="secondary" className="flex items-center gap-1">
       สถานะ: {filters.status === 'active' ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
       <button
        onClick={() => onFilterChange({ ...filters, status: undefined })}
        className="ml-1 hover:text-red-600"
        aria-label="ยกเลิกการกรองสถานะ"
       >
        ×
       </button>
      </Badge>
     )}
     
     {filters.branchId && (
      <Badge variant="secondary" className="flex items-center gap-1">
       สาขา: {branches.find(b => b.id === filters.branchId)?.name || 'ไม่ทราบ'}
       <button
        onClick={() => onFilterChange({ ...filters, branchId: undefined })}
        className="ml-1 hover:text-red-600"
        aria-label="ยกเลิกการกรองสาขา"
       >
        ×
       </button>
      </Badge>
     )}
    </div>
   )}
  </div>
 )
}