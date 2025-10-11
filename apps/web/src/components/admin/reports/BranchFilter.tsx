'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building2, Loader2, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Branch {
 id: string
 name: string
 address: string
 latitude?: number
 longitude?: number
}

interface BranchFilterProps {
 selectedBranchId: string | null
 onBranchChange: (branchId: string | null) => void
 isLoading?: boolean
}

export function BranchFilter({ selectedBranchId, onBranchChange, isLoading }: BranchFilterProps) {
 const [branches, setBranches] = useState<Branch[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
  fetchBranches()
 }, [])

 const fetchBranches = async () => {
  try {
   setLoading(true)
   setError(null)

   console.log('🔄 Fetching branches for filter...')

   const response = await fetch('/api/admin/branches', {
    credentials: 'include',
    headers: {
     'Content-Type': 'application/json'
    }
   })

   console.log('📡 Branches API response:', response.status, response.statusText)

   if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
   }

   const result = await response.json()
   console.log('✅ Branches fetched:', { count: result.branches?.length || 0 })

   if (result.success && result.branches) {
    setBranches(result.branches)
   } else {
    throw new Error('Invalid response format')
   }

  } catch (err) {
   console.error('❌ Error fetching branches:', err)
   setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลสาขา')
   setBranches([])
  } finally {
   setLoading(false)
  }
 }

 const handleBranchChange = (value: string) => {
  const branchId = value === 'all' ? null : value
  console.log('🏢 Branch filter changed:', { from: selectedBranchId, to: branchId })
  onBranchChange(branchId)
 }

 const getSelectedValue = () => {
  if (loading || error) return 'all'
  return selectedBranchId || 'all'
 }

 const getSelectedBranchName = (): string => {
  if (!selectedBranchId) return 'ทุกสาขา'
  const branch = branches.find(b => b.id === selectedBranchId)
  return branch?.name || 'สาขาที่เลือก'
 }

 return (
  <div className="space-y-4">
   {/* Header Section */}
   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center gap-3">
     <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-lg">
      <Building2 className="h-5 w-5 text-primary" />
     </div>
     <div>
      <h2 className="text-lg font-semibold text-foreground">สาขา</h2>
      <p className="text-sm text-muted-foreground">
       เลือกสาขาที่ต้องการดูรายงาน
      </p>
     </div>
    </div>
    <Badge variant="outline" className="gap-2">
     <MapPin className="h-3.5 w-3.5" />
     <span className="text-xs font-medium">{getSelectedBranchName()}</span>
    </Badge>
   </div>

   {/* Filter Options */}
   <div className="bg-card dark:bg-card border border-border rounded-lg p-4">
    <Select
     value={getSelectedValue()}
     onValueChange={handleBranchChange}
     disabled={loading || isLoading || !!error}
    >
     <SelectTrigger className={cn(
      "w-full bg-background dark:bg-background",
      error && "border-destructive"
     )}>
      <SelectValue>
       <div className="flex items-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {error ? (
         <span className="text-destructive">เกิดข้อผิดพลาด</span>
        ) : (
         <span>{getSelectedBranchName()}</span>
        )}
       </div>
      </SelectValue>
     </SelectTrigger>
     <SelectContent className="bg-card dark:bg-card border-border">
      <SelectItem value="all">
       <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
         <span className="font-medium">ทุกสาขา</span>
         <span className="text-xs text-muted-foreground">แสดงข้อมูลทุกสาขา</span>
        </div>
       </div>
      </SelectItem>
      {branches.map((branch) => (
       <SelectItem key={branch.id} value={branch.id}>
        <div className="flex items-center gap-2">
         <MapPin className="h-4 w-4 text-muted-foreground" />
         <div className="flex flex-col">
          <span className="font-medium">{branch.name}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[250px]">
           {branch.address}
          </span>
         </div>
        </div>
       </SelectItem>
      ))}
     </SelectContent>
    </Select>

    {error && (
     <p className="text-xs text-destructive mt-2 flex items-center gap-1">
      <span>⚠️</span>
      <span>{error}</span>
     </p>
    )}
   </div>
  </div>
 )
}
