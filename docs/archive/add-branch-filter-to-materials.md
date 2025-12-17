# เพิ่มการกรองตามสาขาใน Material Reports

## 🎯 วัตถุประสงค์
เพิ่มฟีเจอร์การกรองแยกตามสาขาใน Material Reports page เพื่อให้สามารถดูข้อมูลการใช้วัตถุดิบแยกตามสาขาได้

## 📋 ขั้นตอนการพัฒนา

### 1. แก้ไข API Endpoint

**ไฟล์**: `apps/web/src/app/api/admin/reports/materials/route.ts`

```typescript
// เพิ่มในส่วน parse query parameters (บรรทัด 58-63)
const branchId = searchParams.get('branchId') // เพิ่มบรรทัดนี้

// เพิ่มในส่วน build query (หลังจากบรรทัด 137)
// Apply branch filter if specified
if (branchId) {
  query = query.eq('time_entries.branch_id', branchId)
}
```

### 2. เพิ่ม Branch Filter Component

**ไฟล์ใหม่**: `apps/web/src/components/admin/reports/BranchFilter.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2 } from 'lucide-react'

interface Branch {
  id: string
  name: string
  address: string
}

interface BranchFilterProps {
  selectedBranchId: string | null
  onBranchChange: (branchId: string | null) => void
  isLoading?: boolean
}

export function BranchFilter({ selectedBranchId, onBranchChange, isLoading }: BranchFilterProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/admin/branches', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches || [])
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={selectedBranchId || 'all'} 
        onValueChange={(value) => onBranchChange(value === 'all' ? null : value)}
        disabled={loading || isLoading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="เลือกสาขา" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทุกสาขา</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

### 3. แก้ไข MaterialDetailPage

**ไฟล์**: `apps/web/src/components/admin/reports/MaterialDetailPage.tsx`

```typescript
// เพิ่ม import
import { BranchFilter } from './BranchFilter'

// เพิ่ม state (บรรทัด 51-55)
const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)

// แก้ไข getInitialDateRange (บรรทัด 38-48)
const getInitialDateRange = (): DateRangeFilter => {
  const dateRangeType = searchParams.get('dateRange') || 'today'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  
  // เพิ่มการอ่าน branchId จาก URL
  const branchId = searchParams.get('branchId')
  if (branchId) {
    setSelectedBranchId(branchId)
  }
  
  return {
    type: dateRangeType as DateRangeFilter['type'],
    startDate: startDate || undefined,
    endDate: endDate || undefined
  }
}

// แก้ไข fetchMaterialData (บรรทัด 58-90)
const fetchMaterialData = async (selectedRange: DateRangeFilter, branchId: string | null = null) => {
  // ... existing validation code ...
  
  // เพิ่ม branchId ใน API call
  const queryParams = new URLSearchParams()
  queryParams.set('dateRange', selectedRange.type)
  if (selectedRange.startDate) queryParams.set('startDate', selectedRange.startDate)
  if (selectedRange.endDate) queryParams.set('endDate', selectedRange.endDate)
  if (branchId) queryParams.set('branchId', branchId) // เพิ่มบรรทัดนี้
  
  const result = await adminReportsService.getMaterialReports(selectedRange, branchId)
  // ... rest of the function ...
}

// เพิ่ม handler สำหรับ branch change
const handleBranchChange = (branchId: string | null) => {
  setSelectedBranchId(branchId)
  fetchMaterialData(dateRange, branchId)
  
  // Update URL params
  const params = new URLSearchParams()
  params.set('dateRange', dateRange.type)
  if (dateRange.startDate) params.set('startDate', dateRange.startDate)
  if (dateRange.endDate) params.set('endDate', dateRange.endDate)
  if (branchId) params.set('branchId', branchId) // เพิ่มบรรทัดนี้
  
  const newUrl = `/admin/reports/materials?${params.toString()}`
  window.history.replaceState({}, '', newUrl)
}

// แก้ไข UI (ในส่วน return statement)
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-4">
    <Button variant="outline" onClick={() => router.push('/admin/reports')}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      กลับไปรายงานหลัก
    </Button>
    
    <div className="flex items-center gap-4">
      <ReportsDateFilter 
        value={dateRange}
        onChange={handleDateRangeChange}
        isLoading={isLoading}
      />
      
      {/* เพิ่ม BranchFilter */}
      <BranchFilter
        selectedBranchId={selectedBranchId}
        onBranchChange={handleBranchChange}
        isLoading={isLoading}
      />
    </div>
  </div>
  
  <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
    รีเฟรช
  </Button>
</div>
```

### 4. แก้ไข AdminReportsService

**ไฟล์**: `apps/web/src/lib/services/admin-reports.service.ts`

```typescript
// แก้ไข getMaterialReports method (บรรทัด 351-392)
async getMaterialReports(
  dateRange: DateRangeFilter, 
  branchId: string | null = null, 
  limit: number = 100
): Promise<AdminReportsServiceResult<MaterialReport>> {
  try {
    const queryParams = this.formatDateRange(dateRange)
    if (branchId) {
      queryParams.append('branchId', branchId) // เพิ่มบรรทัดนี้
    }
    queryParams.append('limit', limit.toString())
    
    const url = `/api/admin/reports/materials?${queryParams.toString()}`
    // ... rest of the method ...
  }
}
```

### 5. สร้าง API สำหรับดึงรายการสาขา

**ไฟล์ใหม่**: `apps/web/src/app/api/admin/branches/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const adminClient = await createSupabaseServerClient()
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get branches
    const { data: branches, error } = await adminClient
      .from('branches')
      .select('id, name, address')
      .eq('is_active', true)
      .order('name')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 })
    }

    return NextResponse.json({ branches })

  } catch (error) {
    console.error('Branches API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## 🧪 การทดสอบ

### 1. ทดสอบ API
```bash
# ทดสอบดึงรายการสาขา
curl -X GET "http://localhost:3000/api/admin/branches" \
  -H "Cookie: your-auth-cookie"

# ทดสอบ Material Reports พร้อม branch filter
curl -X GET "http://localhost:3000/api/admin/reports/materials?dateRange=today&branchId=11111111-1111-1111-1111-111111111111"
```

### 2. ทดสอบ UI
1. เปิด `http://localhost:3000/admin/reports/materials`
2. ตรวจสอบว่ามี Branch Filter dropdown
3. เลือกสาขาต่างๆ และดูว่าข้อมูลเปลี่ยนตาม
4. ทดสอบ URL parameters ว่าอัปเดตถูกต้อง

## 📊 ผลลัพธ์ที่คาดหวัง

### URL Examples
- **ทุกสาขา**: `/admin/reports/materials?dateRange=today`
- **สาขาเฉพาะ**: `/admin/reports/materials?dateRange=today&branchId=11111111-1111-1111-1111-111111111111`
- **สัปดาห์นี้ + สาขา**: `/admin/reports/materials?dateRange=week&branchId=22222222-2222-2222-2222-222222222222`

### UI Changes
- มี Branch Filter dropdown อยู่ข้าง Date Filter
- เมื่อเลือกสาขา ข้อมูลจะกรองตามสาขาที่เลือก
- URL จะอัปเดตตามการเลือก
- MaterialBranchBreakdown จะแสดงเฉพาะสาขาที่เลือก

## 🎯 ข้อดี

1. **การกรองที่แม่นยำ**: สามารถดูข้อมูลการใช้วัตถุดิบแยกตามสาขาได้
2. **URL Bookmarkable**: สามารถ bookmark URL พร้อม filter ได้
3. **User Experience**: ง่ายต่อการใช้งาน
4. **Performance**: กรองข้อมูลที่ database level

## ⚠️ หมายเหตุ

1. **Dependencies**: ต้องมีข้อมูล branches ในฐานข้อมูล
2. **RLS Policies**: อาจต้องปรับ RLS policies สำหรับ branches table
3. **Error Handling**: ต้องจัดการกรณีที่ไม่มีสาขาหรือสาขาไม่ถูกต้อง
4. **Caching**: อาจต้องเพิ่ม caching สำหรับรายการสาขา

---

**สถานะ**: 📝 รอการพัฒนา  
**ความสำคัญ**: 🔥 สูง  
**ความซับซ้อน**: 🟡 ปานกลาง
