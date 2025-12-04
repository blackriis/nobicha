'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
 Clock,
 User,
 Building2,
 Calendar,
 RefreshCw,
 Search,
 Filter,
 Download,
 Eye,
 MapPin,
 Camera,
 AlertCircle,
 CheckCircle
} from 'lucide-react'

// Import types and services
import { 
 adminReportsService, 
 type DateRangeFilter 
} from '@/lib/services/admin-reports.service'
import { TimeEntryDetailModal } from '@/components/admin/TimeEntryDetailModal'
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker'

interface TimeEntryDetail {
 id: string
 userId: string
 employeeId: string
 employeeName: string
 branchName: string
 checkInTime: string
 checkOutTime: string | null
 totalHours: number
 status: 'completed' | 'in_progress' | 'incomplete'
 checkInSelfieUrl?: string
 checkOutSelfieUrl?: string
 latitude?: number
 longitude?: number
}

export function AdminTimeEntriesPage() {
 // State management
 const [timeEntries, setTimeEntries] = useState<TimeEntryDetail[]>([])
 const [filteredEntries, setFilteredEntries] = useState<TimeEntryDetail[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [branches, setBranches] = useState<Array<{id: string, name: string}>>([])
 
 // Filter states
 const [searchTerm, setSearchTerm] = useState('')
 const [statusFilter, setStatusFilter] = useState<string>('all')
 const [dateRange, setDateRange] = useState<DateRangeFilter>({ type: 'today' })
 const [branchFilter, setBranchFilter] = useState<string>('all')
 
 // Date range picker state
 const [dateRangePicker, setDateRangePicker] = useState<DateRange>({
  from: undefined,
  to: undefined
 })
 
 // Modal state for time entry detail
 const [selectedTimeEntryId, setSelectedTimeEntryId] = useState<string | null>(null)
 const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)


 // Fetch branches data
 const fetchBranches = async () => {
  try {
   const response = await fetch('/api/admin/branches', {
    method: 'GET',
    headers: {
     'Content-Type': 'application/json',
    },
   })

   if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลสาขา')
   }

   const result = await response.json()
   console.log('Branches API response:', result)
   
   // API returns { success: true, branches: [...] }
   if (result.success && result.branches) {
     // Ensure branches have the correct structure
     const formattedBranches = result.branches.map((branch: any) => ({
       id: branch.id,
       name: branch.name || 'Unknown Branch'
     }))
     console.log('Fetched branches:', formattedBranches.length, 'branches')
     setBranches(formattedBranches)
   } else {
     console.warn('Invalid branches response format:', result)
     setBranches([])
   }
  } catch (err) {
   console.error('Fetch branches error:', err)
   // Don't set error state for branches, just log it
  }
 }

 // Fetch time entries data
 const fetchTimeEntries = async () => {
  setIsLoading(true)
  setError(null)

  try {
   // Get auth token from session
   const { createClientComponentClient } = await import('@/lib/supabase')
   const supabase = createClientComponentClient()
   const { data: { session }, error: sessionError } = await supabase.auth.getSession()
   
   if (sessionError || !session?.access_token) {
    setError('ไม่พบการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่')
    setIsLoading(false)
    return
   }

   // Build query parameters
   const params = new URLSearchParams()
   params.append('limit', '100')
   if (branchFilter !== 'all') params.append('branch', branchFilter)
    if (statusFilter !== 'all') params.append('status', statusFilter)
    if (searchTerm) params.append('search', searchTerm)
    
    // Add date range parameters
    if (dateRangePicker.from) {
     params.append('from', dateRangePicker.from.toISOString())
    }
    if (dateRangePicker.to) {
     params.append('to', dateRangePicker.to.toISOString())
    }

   const apiUrl = `/api/admin/time-entries?${params.toString()}`
   console.log('Fetching from API:', apiUrl)
   
   const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${session.access_token}`,
    },
   })

   console.log('Response received:', response.status, response.statusText)

   if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('API Error Response:', errorData)
    console.error('Response Status:', response.status)
    console.error('Response Headers:', Object.fromEntries(response.headers.entries()))
    throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลการลงเวลาทำงาน')
   }

   const result = await response.json()
   setTimeEntries(result.data || [])
   setFilteredEntries(result.data || [])
  } catch (err) {
   console.error('Fetch time entries error:', err)
   setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลการลงเวลาทำงาน')
  } finally {
   setIsLoading(false)
  }
 }

 // Filter entries based on search and filters
 useEffect(() => {
  let filtered = timeEntries

  // Search filter (client-side filtering for better UX)
  if (searchTerm) {
   filtered = filtered.filter(entry => 
    entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.branchName.toLowerCase().includes(searchTerm.toLowerCase())
   )
  }

  // Status filter (client-side filtering for better UX)
  if (statusFilter !== 'all') {
   filtered = filtered.filter(entry => entry.status === statusFilter)
  }

  // Branch filter is handled server-side by API, no need for client-side filtering

  setFilteredEntries(filtered)
 }, [timeEntries, searchTerm, statusFilter])

 // Refetch data when filters change
 useEffect(() => {
  fetchTimeEntries()
 }, [branchFilter, statusFilter, dateRangePicker])

 // Initial data load
 useEffect(() => {
  fetchBranches()
  fetchTimeEntries()
 }, [])

 // Format time display
 const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('th-TH', {
   hour: '2-digit',
   minute: '2-digit'
  })
 }

 const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleDateString('th-TH', {
   year: 'numeric',
   month: 'short',
   day: 'numeric'
  })
 }

 const formatHours = (hours: number) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h} ชม. ${m} นาที`
 }

 const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
   case 'completed':
    return 'default'
   case 'in_progress':
    return 'secondary'
   case 'incomplete':
    return 'destructive'
   default:
    return 'outline'
  }
 }

 const getStatusText = (status: string) => {
  switch (status) {
   case 'completed':
    return 'เสร็จสิ้น'
   case 'in_progress':
    return 'กำลังทำงาน'
   case 'incomplete':
    return 'ไม่สมบูรณ์'
   default:
    return 'ไม่ทราบ'
  }
 }

 // Branches are already loaded from API, no need to derive from time entries

 // Handle view details button click
 const handleViewDetails = (timeEntryId: string) => {
  setSelectedTimeEntryId(timeEntryId)
  setIsDetailModalOpen(true)
 }

 // Handle modal close
 const handleCloseModal = () => {
  setIsDetailModalOpen(false)
  setSelectedTimeEntryId(null)
 }

 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-3xl font-bold tracking-tight">รายละเอียดการลงเวลาทำงาน</h1>
     <p className="text-muted-foreground">
      ข้อมูลการ check-in/check-out ของพนักงานทั้งหมด
     </p>
    </div>
    
    <div className="flex items-center gap-3">
     <Button 
      variant="outline" 
      size="sm" 
      onClick={fetchTimeEntries}
      disabled={isLoading}
      className="gap-2"
     >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      รีเฟรช
     </Button>
     
     <Button 
      variant="outline" 
      size="sm" 
      className="gap-2"
     >
      <Download className="h-4 w-4" />
      ส่งออก CSV
     </Button>
    </div>
   </div>

   <Separator />

   {/* Filters */}
   <Card>
    <CardHeader>
     <CardTitle className="text-lg flex items-center gap-2">
      <Filter className="h-5 w-5" />
      ตัวกรองข้อมูล
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Date Range Picker */}
      <div className="space-y-2">
       <label className="text-sm font-medium">ช่วงเวลา</label>
       <DateRangePicker
        dateRange={dateRangePicker}
        onDateRangeChange={setDateRangePicker}
       />
      </div>
      {/* Search */}
      <div className="space-y-2">
       <label className="text-sm font-medium">ค้นหา</label>
       <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
         placeholder="ชื่อพนักงาน, รหัส, สาขา..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="pl-9"
        />
       </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
       <label className="text-sm font-medium">สถานะ</label>
       <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger>
         <SelectValue placeholder="เลือกสถานะ" />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="all">ทั้งหมด</SelectItem>
         <SelectItem value="completed">เสร็จสิ้น</SelectItem>
         <SelectItem value="in_progress">กำลังทำงาน</SelectItem>
         <SelectItem value="incomplete">ไม่สมบูรณ์</SelectItem>
        </SelectContent>
       </Select>
      </div>

      {/* Branch Filter */}
      <div className="space-y-2">
       <label className="text-sm font-medium">สาขา</label>
       <Select value={branchFilter} onValueChange={setBranchFilter}>
        <SelectTrigger>
         <SelectValue placeholder="เลือกสาขา" />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="all">ทั้งหมด</SelectItem>
         {branches.map(branch => (
          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
         ))}
        </SelectContent>
       </Select>
      </div>

      {/* Date Range - Placeholder */}
      <div className="space-y-2">
       <label className="text-sm font-medium">ช่วงเวลา</label>
       <Select value="today" onValueChange={() => {}}>
        <SelectTrigger>
         <SelectValue placeholder="เลือกช่วงเวลา" />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="today">วันนี้</SelectItem>
         <SelectItem value="week">สัปดาห์นี้</SelectItem>
         <SelectItem value="month">เดือนนี้</SelectItem>
        </SelectContent>
       </Select>
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Results Summary */}
   <div className="flex items-center justify-between">
    <p className="text-sm text-muted-foreground">
     พบ {filteredEntries.length} รายการจากทั้งหมด {timeEntries.length} รายการ
    </p>
   </div>

   {/* Time Entries List */}
   <div className="space-y-4">
    {isLoading ? (
     // Loading state
     Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="border-border bg-card">
       <CardContent className="p-6">
        <div className="space-y-4">
         <Skeleton className="h-4 w-1/4" />
         <Skeleton className="h-4 w-1/2" />
         <Skeleton className="h-4 w-1/3" />
        </div>
       </CardContent>
      </Card>
     ))
    ) : error ? (
     <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="font-medium">
       {error}
      </AlertDescription>
     </Alert>
    ) : filteredEntries.length === 0 ? (
     <Card className="border-border bg-card">
      <CardContent className="p-8 text-center">
       <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
       <p className="text-muted-foreground">ไม่พบข้อมูลการลงเวลาทำงานที่ตรงกับเงื่อนไข</p>
      </CardContent>
     </Card>
    ) : (
     filteredEntries.map((entry) => (
      <Card key={entry.id} className="border-border bg-card hover: ">
       <CardContent className="p-6">
        <div className="flex items-start justify-between">
         <div className="flex-1 space-y-4">
          {/* Employee & Branch Info */}
          <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{entry.employeeName}</span>
            <Badge variant="outline" className="text-xs">
             {entry.employeeId}
            </Badge>
           </div>
           
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{entry.branchName}</span>
           </div>
           
           <Badge 
            variant={getStatusVariant(entry.status)}
            className="text-xs"
           >
            {getStatusText(entry.status)}
           </Badge>
          </div>

          {/* Time Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="font-medium text-foreground">เข้างาน:</span>
            <span className="text-muted-foreground">{formatDate(entry.checkInTime)} {formatTime(entry.checkInTime)}</span>
           </div>
           
           {entry.checkOutTime ? (
            <div className="flex items-center gap-2 text-sm">
             <Calendar className="h-4 w-4 text-destructive" />
             <span className="font-medium text-foreground">เลิกงาน:</span>
             <span className="text-muted-foreground">{formatTime(entry.checkOutTime)}</span>
            </div>
           ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <Calendar className="h-4 w-4" />
             <span>ยังไม่เลิกงาน</span>
            </div>
           )}
           
           <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">รวม:</span>
            <Badge variant="secondary" className="text-xs">
             {entry.status === 'completed' ? formatHours(entry.totalHours) : 'กำลังทำงาน'}
            </Badge>
           </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
           {entry.latitude && entry.longitude && (
            <div className="flex items-center gap-1">
             <MapPin className="h-3 w-3" />
             <span>GPS: {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}</span>
            </div>
           )}
           
           {entry.checkInSelfieUrl && (
            <div className="flex items-center gap-1">
             <Camera className="h-3 w-3" />
             <span>มีภาพถ่าย</span>
            </div>
           )}
          </div>
         </div>

         {/* Action Button */}
         <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => handleViewDetails(entry.id)}
         >
          <Eye className="h-4 w-4" />
          ดูรายละเอียด
         </Button>
        </div>
       </CardContent>
      </Card>
     ))
    )}
   </div>

   {/* Time Entry Detail Modal */}
   {selectedTimeEntryId && (
    <TimeEntryDetailModal
     isOpen={isDetailModalOpen}
     onClose={handleCloseModal}
     timeEntryId={selectedTimeEntryId}
     employeeId={timeEntries.find(entry => entry.id === selectedTimeEntryId)?.userId || ''}
    />
   )}
  </div>
 )
}