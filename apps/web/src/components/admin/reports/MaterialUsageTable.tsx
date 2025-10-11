'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Package,
  Search,
  ArrowUpDown,
  Building2,
  Users,
  DollarSign
} from 'lucide-react'
import { adminReportsService } from '@/lib/services/admin-reports.service'

interface MaterialUsageTableProps {
  materials: Array<{
    materialId: string
    materialName: string
    unit: string
    supplier: string
    totalQuantity: number
    totalCost: number
    usageCount: number
    branches: string[]
    employees: string[]
    averageCostPerUsage: number
    averageQuantityPerUsage: number
  }>
  isLoading: boolean
  selectedBranchId: string | null
}

type SortField = 'materialName' | 'totalCost' | 'usageCount' | 'totalQuantity' | 'averageCostPerUsage'
type SortDirection = 'asc' | 'desc'

export function MaterialUsageTable({ materials, isLoading, selectedBranchId }: MaterialUsageTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('totalCost')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Client-side branch filtering
  const branchFilteredMaterials = selectedBranchId
    ? materials.filter(material =>
        material.branches.includes(selectedBranchId)
      )
    : materials

  // Filter materials based on search term
  const filteredMaterials = branchFilteredMaterials.filter(material =>
    material.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    let aValue: number | string = a[sortField]
    let bValue: number | string = b[sortField]

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue as string).toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMaterials = sortedMaterials.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </Button>
  )

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!materials || materials.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ไม่มีข้อมูลการใช้วัตถุดิบ</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              ตารางการใช้วัตถุดิบ
              {selectedBranchId && (
                <Badge variant="secondary" className="ml-2">
                  กรองตามสาขา
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedBranchId
                ? `แสดงเฉพาะวัตถุดิบที่ใช้ในสาขาที่เลือก (${filteredMaterials.length} รายการ)`
                : `ข้อมูลการใช้งานและต้นทุนวัตถุดิบแต่ละรายการ`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาวัตถุดิบ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Empty state for filtered results */}
        {selectedBranchId && filteredMaterials.length === 0 && !searchTerm ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">ไม่พบวัตถุดิบที่ใช้ในสาขานี้</p>
          </div>
        ) : (
          <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <SortButton field="materialName">ชื่อวัตถุดิบ</SortButton>
                </TableHead>
                <TableHead>
                  ผู้จัดจำหน่าย
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="totalQuantity">ปริมาณรวม</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="totalCost">ต้นทุนรวม</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="usageCount">ครั้งที่ใช้</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="averageCostPerUsage">ต้นทุนเฉลี่ย</SortButton>
                </TableHead>
                <TableHead className="text-center">สาขา/พนักงาน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMaterials.map((material) => (
                <TableRow key={material.materialId} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{material.materialName}</div>
                      <div className="text-sm text-muted-foreground">
                        หน่วย: {material.unit}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {material.supplier}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="font-medium">
                      {material.totalQuantity.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {material.unit}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="font-medium text-green-600">
                      {adminReportsService.formatCurrency(material.totalCost)}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {material.usageCount} ครั้ง
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="font-medium text-blue-600">
                      {adminReportsService.formatCurrency(material.averageCostPerUsage)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {material.averageQuantityPerUsage.toFixed(2)} {material.unit}/ครั้ง
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{material.branches.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{material.employees.length}</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              แสดง {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedMaterials.length)} จากทั้งหมด {sortedMaterials.length} รายการ
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                  const pageNumber = Math.max(1, currentPage - 2) + index
                  if (pageNumber > totalPages) return null
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        )}
          </>
        )}
      </CardContent>
    </Card>
  )
}