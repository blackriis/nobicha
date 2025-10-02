'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'
import { EmployeeTable } from './EmployeeTable'
import { EmployeeSearchBar } from './EmployeeSearchBar'
import { EmployeeFilters } from './EmployeeFilters'
import { TablePagination } from './TablePagination'
import { 
  EmployeeListItem, 
  EmployeeListResponse, 
  SearchFilters, 
  PaginationParams 
} from '@/lib/services/employee.service'
import { Users, UserPlus, Download } from 'lucide-react'

export function EmployeeListPage() {
  const { user, session } = useAuth()
  const router = useRouter()
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Omit<SearchFilters, 'search'>>({
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20
  })
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  // Fetch employees data
  const fetchEmployees = useCallback(async () => {
    if (!user || !session?.access_token) return

    setLoading(true)
    setError(null)

    try {
      const token = session.access_token
      const queryParams = new URLSearchParams()

      // Add search parameter
      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim())
      }

      // Add filter parameters
      if (filters.role) {
        queryParams.append('role', filters.role)
      }
      if (filters.status) {
        queryParams.append('status', filters.status)
      }
      if (filters.branchId) {
        queryParams.append('branchId', filters.branchId)
      }
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy)
      }
      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder)
      }

      // Add pagination parameters
      queryParams.append('page', pagination.page.toString())
      queryParams.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/admin/employees?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน')
      }

      const data: EmployeeListResponse & { success: boolean; message: string } = await response.json()
      
      setEmployees(data.data)
      setTotalItems(data.total)
      setTotalPages(Math.ceil(data.total / pagination.limit))

    } catch (err) {
      console.error('Failed to fetch employees:', err)
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน')
    } finally {
      setLoading(false)
    }
  }, [user, session, searchTerm, filters, pagination])

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // Search handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on search
  }

  // Filter handlers
  const handleFilterChange = (newFilters: Omit<SearchFilters, 'search'>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on filter change
  }

  // Sort handlers
  const handleSort = (field: SearchFilters['sortBy']) => {
    const newSortOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: newSortOrder
    }))
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination({ page: 1, limit })
  }

  // Export handler (placeholder)
  const handleExport = () => {
    // TODO: Implement export functionality in future story
    console.log('Export functionality will be implemented in future story')
  }

  // Navigation handlers
  const handleAddEmployee = () => {
    router.push('/admin/employees/add')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              รายชื่อพนักงาน
            </h1>
          </div>
          <p className="text-muted-foreground">
            จัดการและดูข้อมูลพนักงานทั้งหมดในระบบ
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            ส่งออกข้อมูล
          </Button>
          <Button className="gap-2" onClick={handleAddEmployee}>
            <UserPlus className="h-4 w-4" />
            เพิ่มพนักงานใหม่
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ค้นหาและกรองข้อมูล</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <EmployeeSearchBar 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <EmployeeFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <strong>เกิดข้อผิดพลาด:</strong> {error}
            </div>
            <Button 
              variant="outline" 
              onClick={fetchEmployees}
              className="mt-2"
            >
              ลองใหม่อีกครั้ง
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <EmployeeTable
            employees={employees}
            loading={loading}
            onSort={handleSort}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
          />
          
          {/* Pagination */}
          {!loading && employees.length > 0 && (
            <TablePagination
              currentPage={pagination.page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}