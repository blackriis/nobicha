'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatGPSCoordinates } from '@/lib/utils/gps.utils'
import type { Database } from '@employee-management/database'
import { 
 MapPin, 
 Building2, 
 Clock, 
 Plus,
 Edit,
 Settings,
 Trash2,
 RotateCcw,
 Calendar
} from 'lucide-react'

type Branch = Database['public']['Tables']['branches']['Row']

interface BranchWithShiftsCount extends Branch {
 shifts_count: number
}

interface BranchListProps {
 onEditBranch: (branch: Branch) => void
 onDeleteBranch: (branch: Branch) => void
 onAddBranch: () => void
 onManageShifts: (branchId: string, branchName: string) => void
 refreshTrigger?: number
}

export function BranchList({
 onEditBranch,
 onDeleteBranch,
 onAddBranch,
 onManageShifts,
 refreshTrigger = 0
}: BranchListProps) {
 const [branches, setBranches] = useState<BranchWithShiftsCount[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 const fetchBranches = async () => {
  try {
   setLoading(true)
   setError(null)

   const response = await fetch('/api/admin/branches')
   const result = await response.json().catch(() => ({}))

   if (!response.ok) {
    if (response.status === 401) {
     setError('ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนเข้าหน้านี้')
     return
    }
    if (response.status === 403) {
     setError('ต้องเป็นผู้ดูแลระบบ (Admin) จึงจะเข้าถึงส่วนนี้ได้')
     return
    }
    setError((result as { error?: string }).error || 'ไม่สามารถดึงข้อมูลสาขาได้')
    return
   }

   setBranches((result as { branches?: unknown[] }).branches || [])
  } catch (error) {
   console.error('Error fetching branches:', error)
   setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล')
  } finally {
   setLoading(false)
  }
 }

 useEffect(() => {
  fetchBranches()
 }, [refreshTrigger])

 const handleDelete = (branch: Branch) => {
  if (window.confirm(`คุณต้องการลบสาขา "${branch.name}" หรือไม่?`)) {
   onDeleteBranch(branch)
  }
 }

 if (loading) {
  return (
   <Card className="border-0 ">
    <CardContent className="p-8">
     <div className="flex items-center justify-center space-x-2">
      <RotateCcw className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-muted-foreground">กำลังโหลดข้อมูลสาขา...</span>
     </div>
    </CardContent>
   </Card>
  )
 }

 if (error) {
  return (
   <Card className="border-0 border-destructive/20">
    <CardContent className="p-8">
     <div className="text-center">
      <p className="text-destructive mb-4">{error}</p>
      <Button 
       onClick={fetchBranches} 
       variant="outline" 
       size="sm"
       className="gap-2"
      >
       <RotateCcw className="h-4 w-4" />
       ลองใหม่
      </Button>
     </div>
    </CardContent>
   </Card>
  )
 }

 return (
  <div className="space-y-4">
   <div className="flex justify-between items-start">
    <div className="space-y-1">
     <div className="flex items-center gap-2">
      <div className="p-2 bg-primary/10 rounded-lg">
       <Building2 className="h-5 w-5 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">จัดการสาขา</h2>
     </div>
     <div className="flex items-center gap-4">
      <p className="text-muted-foreground">จำนวนสาขาทั้งหมด: {branches.length} สาขา</p>
      <Badge variant="secondary" className="gap-1">
       <MapPin className="h-3 w-3" />
       ตำแหน่งที่ตั้ง GPS
      </Badge>
     </div>
    </div>
    <Button onClick={onAddBranch} className="gap-2" data-testid="add-branch-btn">
     <Plus className="h-4 w-4" />
     เพิ่มสาขาใหม่
    </Button>
   </div>
   <Separator />

   {branches.length === 0 ? (
    <Card className="border-0 border-dashed">
     <CardContent className="p-12 text-center">
      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground mb-6">ยังไม่มีสาขาในระบบ</p>
      <Button onClick={onAddBranch} className="gap-2">
       <Plus className="h-4 w-4" />
       เพิ่มสาขาแรก
      </Button>
     </CardContent>
    </Card>
   ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="branches-list">
     {branches.map((branch) => (
      <Card key={branch.id} className="border-0 hover: transition-all duration-200 group" data-testid="branch-item">
       <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
         <div className="space-y-2">
          <div className="flex items-center gap-2">
           <div className="p-1.5 bg-green-50 dark:bg-green-950 rounded-lg">
            <Building2 className="h-4 w-4 text-green-600" />
           </div>
           <CardTitle className="text-lg group-hover:text-primary transition-colors" data-testid="branch-name">{branch.name}</CardTitle>
          </div>
          <CardDescription className="flex items-center gap-1" data-testid="branch-address">
           <MapPin className="h-3 w-3" />
           {(branch as any).address || 'ไม่ระบุที่อยู่'}
          </CardDescription>
         </div>
         <Badge variant="outline" className="gap-1 text-xs">
          <Clock className="h-3 w-3" />
          {branch.shifts_count} กะ
         </Badge>
        </div>
       </CardHeader>
       <CardContent className="pt-0">
        <div className="space-y-4">
         <Separator />
         
         <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
           <span className="text-muted-foreground font-medium">Latitude:</span>
           <div className="font-mono text-xs bg-muted px-2 py-1 rounded">{branch.latitude}</div>
          </div>
          <div className="space-y-1">
           <span className="text-muted-foreground font-medium">Longitude:</span>
           <div className="font-mono text-xs bg-muted px-2 py-1 rounded">{branch.longitude}</div>
          </div>
         </div>

         <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          สร้างเมื่อ: {new Date(branch.created_at).toLocaleDateString('th-TH', {
           year: 'numeric',
           month: 'short',
           day: 'numeric'
          })}
         </div>

         <div className="flex flex-wrap gap-2 pt-2">
          <Button
           variant="outline"
           size="sm"
           onClick={() => onEditBranch(branch)}
           className="gap-2 flex-1"
           data-testid="edit-branch-btn"
          >
           <Edit className="h-3 w-3" />
           แก้ไข
          </Button>
          <Button
           variant="outline"
           size="sm"
           onClick={() => onManageShifts(branch.id, branch.name)}
           className="gap-2 flex-1"
          >
           <Settings className="h-3 w-3" />
           จัดการกะ
          </Button>
          <Button
           variant="outline"
           size="sm"
           onClick={() => handleDelete(branch)}
           className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
           data-testid="delete-branch-btn"
          >
           <Trash2 className="h-3 w-3" />
           ลบ
          </Button>
         </div>
        </div>
       </CardContent>
      </Card>
     ))}
    </div>
   )}
  </div>
 )
}