'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Package,
  Users,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { adminReportsService } from '@/lib/services/admin-reports.service'
import { cn } from '@/lib/utils'

interface MaterialBranchBreakdownProps {
  branches: Array<{
    branchId: string
    branchName: string
    totalCost: number
    usageCount: number
    materials: string[]
    employees: string[]
    averageCostPerUsage: number
  }>
  isLoading: boolean
  selectedBranchId: string | null
  onBranchClick: (branchId: string) => void
}

export function MaterialBranchBreakdown({
  branches,
  isLoading,
  selectedBranchId,
  onBranchClick
}: MaterialBranchBreakdownProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="bg-background text-foreground border-border border-0 shadow-sm hover:bg-muted hover:shadow hover:scale-[1.02] transition-colors duration-300">
            <CardHeader className="animate-pulse transition-colors duration-300">
              <div className="h-5 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="animate-pulse space-y-4 transition-colors duration-300">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!branches || branches.length === 0) {
    return (
      <Card className="bg-background text-foreground border-border border-dashed border-2 hover:bg-muted hover:shadow hover:scale-[1.02] transition-colors duration-300">
        <CardContent className="p-8 text-center transition-colors duration-300">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ไม่มีข้อมูลการใช้วัตถุดิบตามสาขา</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate totals for progress bars
  const maxCost = Math.max(...branches.map(b => b.totalCost))
  const maxUsage = Math.max(...branches.map(b => b.usageCount))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {branches.map((branch) => {
        const isSelected = selectedBranchId === branch.branchId

        return (
          <Card
            key={branch.branchId}
            onClick={() => onBranchClick(branch.branchId)}
            className={cn(
              "bg-background text-foreground border-border border-0 shadow-sm hover:bg-muted hover:shadow hover:scale-[1.02] transition-colors duration-300",
              isSelected && "ring-2 ring-blue-500 ring-offset-2 shadow-xl scale-[1.02]"
            )}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`เลือกสาขา ${branch.branchName}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onBranchClick(branch.branchId)
              }
            }}
          >
            <CardHeader className="pb-4 transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-xl shadow-md transition-colors duration-300",
                  isSelected
                    ? "bg-gradient-to-br from-blue-600 to-blue-700"
                    : "bg-gradient-to-br from-blue-500 to-blue-600"
                )}>
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">{branch.branchName}</CardTitle>
                    {isSelected && (
                      <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-border text-xs transition-colors duration-300">
                        เลือกอยู่
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    รหัสสาขา: {branch.branchId}
                  </p>
                </div>
              </div>
            </CardHeader>
          
          <CardContent className="space-y-6 transition-colors duration-300">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-foreground">ต้นทุนรวม</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {adminReportsService.formatCurrency(branch.totalCost)}
                </p>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden transition-colors duration-300">
                  <div 
                    className="bg-accent h-3 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${(branch.totalCost / maxCost) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-foreground">การใช้งาน</span>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {branch.usageCount.toLocaleString()} ครั้ง
                </p>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden transition-colors duration-300">
                  <div 
                    className="bg-accent h-3 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${(branch.usageCount / maxUsage) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Average Cost per Usage */}
            <div className="p-3 bg-muted/50 rounded-lg transition-colors duration-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">ต้นทุนเฉลี่ยต่อครั้ง</span>
                <span className="text-lg font-bold text-purple-600">
                  {adminReportsService.formatCurrency(branch.averageCostPerUsage)}
                </span>
              </div>
            </div>

            {/* Materials and Employees Count */}
            <div className="flex items-center justify-between pt-2 border-t border-border transition-colors duration-300">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">
                  {branch.materials.length} วัตถุดิบ
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-muted-foreground">
                  {branch.employees.length} พนักงาน
                </span>
              </div>
            </div>

            {/* Performance Badge */}
            <div className="flex justify-center">
              {branch.totalCost === maxCost ? (
                <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-border transition-colors duration-300">
                  ต้นทุนสูงสุด
                </Badge>
              ) : branch.usageCount === maxUsage ? (
                <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-border transition-colors duration-300">
                  ใช้งานมากสุด
                </Badge>
              ) : branch.averageCostPerUsage === Math.min(...branches.map(b => b.averageCostPerUsage)) ? (
                <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-border transition-colors duration-300">
                  ประหยัดที่สุด
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-border transition-colors duration-300">
                  ปกติ
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}