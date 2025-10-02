'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RawMaterialsList } from '@/components/admin/RawMaterialsList'
import { RawMaterialForm } from '@/components/admin/RawMaterialForm'
import { RawMaterialDeleteDialog } from '@/components/admin/DeleteConfirmationDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, PackageCheck, AlertTriangle, Plus, ArrowLeft, TrendingUp } from 'lucide-react'
import { rawMaterialsService, type RawMaterial, type RawMaterialsStats } from '@/lib/services/raw-materials.service'
import { toast } from 'sonner'

type ViewMode = 'list' | 'add' | 'edit'

export default function RawMaterialsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<RawMaterial | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rawMaterialToDelete, setRawMaterialToDelete] = useState<RawMaterial | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Stats state
  const [stats, setStats] = useState<RawMaterialsStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Fetch stats on component mount and when data changes
  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      setStatsError(null)
      
      const result = await rawMaterialsService.getRawMaterialsStats()
      
      if (!result.success) {
        throw new Error(result.error || 'ไม่สามารถดึงสถิติได้')
      }
      
      setStats(result.data || null)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStatsError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงสถิติ')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [refreshTrigger])

  const handleAddRawMaterial = () => {
    setSelectedRawMaterial(null)
    setViewMode('add')
  }

  const handleEditRawMaterial = (rawMaterial: RawMaterial) => {
    setSelectedRawMaterial(rawMaterial)
    setViewMode('edit')
  }

  const handleDeleteRawMaterial = (rawMaterial: RawMaterial) => {
    setRawMaterialToDelete(rawMaterial)
    setDeleteDialogOpen(true)
  }

  const handleSave = (savedRawMaterial: RawMaterial) => {
    if (viewMode === 'add') {
      toast.success(`เพิ่มวัตถุดิบ "${savedRawMaterial.name}" เรียบร้อยแล้ว`)
    } else {
      toast.success(`แก้ไขวัตถุดิบ "${savedRawMaterial.name}" เรียบร้อยแล้ว`)
    }
    
    setViewMode('list')
    setSelectedRawMaterial(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedRawMaterial(null)
  }

  const handleDeleteConfirm = async () => {
    if (!rawMaterialToDelete) return

    try {
      setDeleteLoading(true)
      
      const result = await rawMaterialsService.deleteRawMaterial(rawMaterialToDelete.id)
      
      if (!result.success) {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการลบวัตถุดิบ')
        return
      }

      toast.success(`ลบวัตถุดิบ "${rawMaterialToDelete.name}" เรียบร้อยแล้ว`)
      setRefreshTrigger(prev => prev + 1)
      
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setDeleteLoading(false)
      setDeleteDialogOpen(false)
      setRawMaterialToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setRawMaterialToDelete(null)
  }

  // Loading component for stats cards
  const StatsCardSkeleton = () => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        </div>
        <div className="animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <AdminLayout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="mb-4 sm:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              จัดการวัตถุดิบ
            </h1>
          </div>
          <p className="text-muted-foreground">
            จัดการข้อมูลวัตถุดิบ ราคา และการใช้งานในระบบ
          </p>
        </div>
        
        {viewMode !== 'list' && (
          <Button variant="outline" onClick={handleCancel} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับไปรายการ
          </Button>
        )}
      </div>

      <Separator className="mb-8" />

      {/* Stats Cards - Show only in list view */}
      {viewMode === 'list' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              // Loading skeletons
              <>
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </>
            ) : statsError ? (
              // Error state
              <div className="col-span-full">
                <Card className="border-0 shadow-sm border-red-200">
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 mb-2">{statsError}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={fetchStats}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      ลองใหม่
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : stats ? (
              // Actual stats
              <>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      วัตถุดิบทั้งหมด
                    </CardTitle>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalMaterials.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      รายการในระบบ
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      วัตถุดิบพร้อมใช้
                    </CardTitle>
                    <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                      <PackageCheck className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.activeMaterials.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stats.totalMaterials > 0 
                        ? `${Math.round((stats.activeMaterials / stats.totalMaterials) * 100)}% ของทั้งหมด`
                        : 'ไม่มีข้อมูล'
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      สต็อกต่ำ
                    </CardTitle>
                    <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {stats.lowStockMaterials.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ต้องเติมสต็อก
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      มูลค่ารวม
                    </CardTitle>
                    <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {rawMaterialsService.formatCurrency(stats.totalValue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      มูลค่าวัตถุดิบทั้งหมด
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              // No data state
              <div className="col-span-full">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">ไม่มีข้อมูลสถิติ</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      )}

      {/* Main Content */}
      {viewMode === 'list' && (
        <RawMaterialsList
          onAddRawMaterial={handleAddRawMaterial}
          onEditRawMaterial={handleEditRawMaterial}
          onDeleteRawMaterial={handleDeleteRawMaterial}
          refreshTrigger={refreshTrigger}
        />
      )}

      {(viewMode === 'add' || viewMode === 'edit') && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <Plus className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {viewMode === 'add' ? 'เพิ่มวัตถุดิบใหม่' : 'แก้ไขวัตถุดิบ'}
                </CardTitle>
                <CardDescription>
                  {viewMode === 'add' 
                    ? 'กรอกข้อมูลวัตถุดิบใหม่เพื่อเพิ่มเข้าสู่ระบบ' 
                    : 'แก้ไขข้อมูลวัตถุดิบที่เลือก'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RawMaterialForm
              rawMaterial={selectedRawMaterial}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <RawMaterialDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        rawMaterialName={rawMaterialToDelete?.name || ''}
        loading={deleteLoading}
      />
    </AdminLayout>
  )
}