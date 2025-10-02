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
}

export function MaterialBranchBreakdown({ branches, isLoading }: MaterialBranchBreakdownProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardHeader className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="animate-pulse space-y-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!branches || branches.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ไม่มีข้อมูลการใช้วัตถุดิบตามสาขา</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate totals for progress bars
  const maxCost = Math.max(...branches.map(b => b.totalCost))
  const maxUsage = Math.max(...branches.map(b => b.usageCount))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {branches.map((branch) => (
        <Card key={branch.branchId} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-bold">{branch.branchName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  รหัสสาขา: {branch.branchId}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">ต้นทุนรวม</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {adminReportsService.formatCurrency(branch.totalCost)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${(branch.totalCost / maxCost) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">การใช้งาน</span>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {branch.usageCount.toLocaleString()} ครั้ง
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${(branch.usageCount / maxUsage) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Average Cost per Usage */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ต้นทุนเฉลี่ยต่อครั้ง</span>
                <span className="text-lg font-bold text-purple-600">
                  {adminReportsService.formatCurrency(branch.averageCostPerUsage)}
                </span>
              </div>
            </div>

            {/* Materials and Employees Count */}
            <div className="flex items-center justify-between pt-2 border-t">
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
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  ต้นทุนสูงสุด
                </Badge>
              ) : branch.usageCount === maxUsage ? (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  ใช้งานมากสุด
                </Badge>
              ) : branch.averageCostPerUsage === Math.min(...branches.map(b => b.averageCostPerUsage)) ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  ประหยัดที่สุด
                </Badge>
              ) : (
                <Badge variant="outline">
                  ปกติ
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}