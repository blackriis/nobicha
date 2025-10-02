'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Loader2 } from 'lucide-react'

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
      setBranches([]) // Fallback to empty array
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

  const getDisplayText = () => {
    if (loading) return 'กำลังโหลด...'
    if (error) return 'เกิดข้อผิดพลาด'
    return 'เลือกสาขา'
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={getSelectedValue()} 
        onValueChange={handleBranchChange}
        disabled={loading || isLoading || !!error}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={getDisplayText()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {selectedBranchId ? 
              branches.find(b => b.id === selectedBranchId)?.name || 'สาขาที่เลือก' :
              'ทุกสาขา'
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>ทุกสาขา</span>
            </div>
          </SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{branch.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {branch.address}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <div className="text-xs text-red-500 max-w-[200px]">
          {error}
        </div>
      )}
    </div>
  )
}
