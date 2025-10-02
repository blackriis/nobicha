'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Eye,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  X
} from 'lucide-react'
import { TimeEntryDetailModal } from '@/components/admin/TimeEntryDetailModal'

interface TimeEntry {
  id: string
  check_in_time: string
  check_out_time?: string
  total_hours?: number
  status: 'active' | 'completed' | 'incomplete'
  branch_id?: string
  branch_name?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  selfie_url?: string
  material_usage?: Array<{
    id: string
    name: string
    quantity: number
    unit: string
  }>
}

interface FilterOptions {
  search: string
  status: string
  branch: string
  dateRange: string
}

interface TimeEntryListProps {
  employeeId: string
}

export function TimeEntryList({ employeeId }: TimeEntryListProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeEntryId, setSelectedTimeEntryId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    branch: 'all',
    dateRange: 'all'
  })
  const [branches, setBranches] = useState<Array<{id: string, name: string}>>([])
  const [showFilters, setShowFilters] = useState(false)

  const loadTimeEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/employees/${employeeId}/time-entries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลการมาทำงาน')
      }

      const result = await response.json()
      setTimeEntries(result.data || [])
      setFilteredEntries(result.data || [])
    } catch (err) {
      console.error('Load time entries error:', err)
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลการมาทำงาน')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  const loadBranches = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/branches', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        setBranches(result.data || [])
      }
    } catch (err) {
      console.error('Load branches error:', err)
    }
  }, [])

  // Load time entries and branches on component mount
  useEffect(() => {
    if (employeeId) {
      loadTimeEntries()
      loadBranches()
    }
  }, [employeeId, loadTimeEntries, loadBranches])

  // Filter entries when filters change
  useEffect(() => {
    let filtered = [...timeEntries]

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.branch_name?.toLowerCase().includes(searchTerm) ||
        entry.status.toLowerCase().includes(searchTerm)
      )
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status)
    }

    // Branch filter
    if (filters.branch && filters.branch !== 'all') {
      filtered = filtered.filter(entry => entry.branch_id === filters.branch)
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      const entryDate = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(entry => {
            const checkInDate = new Date(entry.check_in_time)
            return checkInDate.toDateString() === now.toDateString()
          })
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(entry => new Date(entry.check_in_time) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(entry => new Date(entry.check_in_time) >= monthAgo)
          break
      }
    }

    setFilteredEntries(filtered)
  }, [timeEntries, filters])

  const handleViewDetails = (timeEntryId: string) => {
    setSelectedTimeEntryId(timeEntryId)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedTimeEntryId(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)
    return `${day}/${month}/${year}`
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      branch: 'all',
      dateRange: 'all'
    })
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '' && value !== 'all').length
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            กำลังทำงาน
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            เสร็จสิ้น
          </Badge>
        )
      case 'incomplete':
        return (
          <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            ไม่สมบูรณ์
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            ไม่ทราบสถานะ
          </Badge>
        )
    }
  }

  const calculateTotalHours = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return '-'
    
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    return `${diffHours.toFixed(1)} ชั่วโมง`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Filter section skeleton */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        
        {/* Table skeleton */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="font-medium">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTimeEntries}
            className="ml-4"
          >
            ลองใหม่
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (timeEntries.length === 0) {
    return (
      <Alert className="border-border bg-card">
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          <div className="text-center py-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ไม่มีข้อมูลการมาทำงาน
            </h3>
            <p className="text-muted-foreground">
              พนักงานรายนี้ยังไม่มีประวัติการมาทำงาน
            </p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (filteredEntries.length === 0 && timeEntries.length > 0) {
    return (
      <div className="space-y-4">
        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>กรองข้อมูล</span>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
            {getActiveFiltersCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  ค้นหา
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="ค้นหาตามสาขา หรือสถานะ..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  สถานะ
                </label>
                <Select value={filters.status} onValueChange={(value: string) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                    <SelectItem value="active">กำลังทำงาน</SelectItem>
                    <SelectItem value="incomplete">ไม่สมบูรณ์</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  สาขา
                </label>
                <Select value={filters.branch} onValueChange={(value: string) => handleFilterChange('branch', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  ช่วงเวลา
                </label>
                <Select value={filters.dateRange} onValueChange={(value: string) => handleFilterChange('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกช่วงเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="today">วันนี้</SelectItem>
                    <SelectItem value="week">7 วันที่ผ่านมา</SelectItem>
                    <SelectItem value="month">30 วันที่ผ่านมา</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <Alert className="border-border bg-card">
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                ไม่พบข้อมูลที่ตรงกับตัวกรอง
              </h3>
              <p className="text-muted-foreground">
                ลองปรับเปลี่ยนตัวกรองหรือล้างตัวกรองเพื่อดูข้อมูลทั้งหมด
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>กรองข้อมูล</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
          {getActiveFiltersCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          พบ {filteredEntries.length} จาก {timeEntries.length} รายการ
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-4 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาตามสาขา หรือสถานะ..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                สถานะ
              </label>
              <Select value={filters.status} onValueChange={(value: string) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  <SelectItem value="active">กำลังทำงาน</SelectItem>
                  <SelectItem value="incomplete">ไม่สมบูรณ์</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                สาขา
              </label>
              <Select value={filters.branch} onValueChange={(value: string) => handleFilterChange('branch', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสาขา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                ช่วงเวลา
              </label>
              <Select value={filters.dateRange} onValueChange={(value: string) => handleFilterChange('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="today">วันนี้</SelectItem>
                  <SelectItem value="week">7 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="month">30 วันที่ผ่านมา</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Time Entries Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>วันที่</TableHead>
              <TableHead>เวลาลง</TableHead>
              <TableHead>เวลาออก</TableHead>
              <TableHead>ชั่วโมงทำงาน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>สาขา</TableHead>
              <TableHead className="w-[100px]">การจัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium text-foreground">
                        {formatDate(entry.check_in_time)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-foreground">
                      {formatTime(entry.check_in_time)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  {entry.check_out_time ? (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-foreground">
                        {formatTime(entry.check_out_time)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <span className="text-sm font-medium text-foreground">
                    {calculateTotalHours(entry.check_in_time, entry.check_out_time)}
                  </span>
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(entry.status)}
                </TableCell>
                
                <TableCell>
                  {entry.branch_name ? (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {entry.branch_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">ไม่ระบุสาขา</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewDetails(entry.id)}
                    title="ดูรายละเอียด"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Time Entry Detail Modal */}
      {selectedTimeEntryId && (
        <TimeEntryDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          timeEntryId={selectedTimeEntryId}
          employeeId={employeeId}
        />
      )}
    </div>
  )
}
