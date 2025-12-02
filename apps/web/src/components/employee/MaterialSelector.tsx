'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus, Search, AlertCircle, RefreshCw } from 'lucide-react'
import { 
 materialUsageService,
 type MaterialUsageItem 
} from '@/lib/services/material-usage.service'
import { type RawMaterial } from '@/lib/services/raw-materials.service'
import { 
 formatQuantity,
 parseQuantityInput,
 formatMaterialName,
 formatUnit
} from '@/lib/utils/material-usage.utils'
import { useAuth } from '@/components/auth/AuthProvider'

interface SelectedMaterial extends MaterialUsageItem {
 material_info?: RawMaterial
}

interface MaterialSelectorProps {
 selectedMaterials: SelectedMaterial[]
 onMaterialsChange: (materials: SelectedMaterial[]) => void
 disabled?: boolean
}

export function MaterialSelector({ 
 selectedMaterials, 
 onMaterialsChange, 
 disabled = false 
}: MaterialSelectorProps) {
 const { isAdmin } = useAuth()
 const [availableMaterials, setAvailableMaterials] = useState<RawMaterial[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [searchTerm, setSearchTerm] = useState('')
 const [showMaterialList, setShowMaterialList] = useState(false)

 // Load available materials
 useEffect(() => {
  loadAvailableMaterials()
 }, [])

 const loadAvailableMaterials = async (retryCount = 0) => {
  try {
   setLoading(true)
   setError(null)

   const result = await materialUsageService.getAvailableRawMaterials()

   if (!result.success) {
    throw new Error(result.error || 'ไม่สามารถดึงข้อมูลวัตถุดิบได้')
   }

   setAvailableMaterials(result.data || [])
  } catch (error) {
   console.error('Error loading materials:', error)
   const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล'
   
   // Retry logic for network errors
   if (retryCount < 2 && errorMessage.includes('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')) {
    console.log(`Retrying material load (attempt ${retryCount + 1}/3)`)
    setTimeout(() => {
     loadAvailableMaterials(retryCount + 1)
    }, 1000 * (retryCount + 1)) // Exponential backoff
    return
   }
   
   setError(errorMessage)
  } finally {
   setLoading(false)
  }
 }

 const filteredMaterials = availableMaterials.filter(material => {
  if (!searchTerm) return true
  return material.name.toLowerCase().includes(searchTerm.toLowerCase())
 }).filter(material => 
  !selectedMaterials.some(selected => selected.material_id === material.id)
 )

 const handleAddMaterial = (material: RawMaterial) => {
  const newMaterial: SelectedMaterial = {
   material_id: material.id,
   quantity_used: 1,
   material_info: material
  }

  onMaterialsChange([...selectedMaterials, newMaterial])
  setShowMaterialList(false)
  setSearchTerm('')
 }

 const handleRemoveMaterial = (index: number) => {
  const updated = selectedMaterials.filter((_, i) => i !== index)
  onMaterialsChange(updated)
 }

 const handleQuantityChange = (index: number, quantityStr: string) => {
  const { value, error: quantityError } = parseQuantityInput(quantityStr)
  
  const updated = [...selectedMaterials]
  updated[index] = {
   ...updated[index],
   quantity_used: value || 0
  }
  
  onMaterialsChange(updated)
 }

 if (loading) {
  return (
   <Card>
    <CardContent className="p-6">
     <div className="flex items-center justify-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      <span>กำลังโหลดรายการวัตถุดิบ...</span>
     </div>
    </CardContent>
   </Card>
  )
 }

 if (error) {
  return (
   <Card className="border-destructive/50 bg-destructive/10">
    <CardContent className="p-6">
     <div className="text-center space-y-3">
      <div className="text-destructive font-medium">
       <AlertCircle className="h-5 w-5 mx-auto mb-2" />
       {error}
      </div>
      <Button 
       onClick={() => loadAvailableMaterials()} 
       variant="outline" 
       size="sm"
       disabled={disabled}
       className="gap-2"
      >
       <RefreshCw className="h-4 w-4" />
       ลองใหม่
      </Button>
     </div>
    </CardContent>
   </Card>
  )
 }

 return (
  <div className="space-y-4">
   {/* Selected Materials */}
   {selectedMaterials.length > 0 && (
    <Card>
     <CardHeader>
      <CardTitle className="text-base sm:text-lg">วัตถุดิบที่เลือก</CardTitle>
     </CardHeader>
     <CardContent className="space-y-3">
      {selectedMaterials.map((material, index) => {
       const materialInfo = material.material_info || availableMaterials.find(m => m.id === material.material_id)

       return (
        <div key={`${material.material_id}-${index}`} className="border border-border rounded-lg bg-card overflow-hidden">
         {/* Material Info Row */}
         <div className="flex items-start justify-between gap-2 p-3 bg-muted/30">
          <div className="flex-1 min-w-0">
           <div className="font-medium text-foreground text-sm sm:text-base truncate">
            {materialInfo ? formatMaterialName(materialInfo.name) : 'ไม่พบข้อมูลวัตถุดิบ'}
           </div>
           {materialInfo && (
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
             หน่วย: {formatUnit(materialInfo.unit)}
            </div>
           )}
          </div>

          <Button
           variant="ghost"
           size="sm"
           onClick={() => handleRemoveMaterial(index)}
           disabled={disabled}
           className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8 p-0"
          >
           <X className="h-4 w-4" />
          </Button>
         </div>

         {/* Quantity Input Row */}
         <div className="flex items-center gap-3 p-3">
          <div className="flex-1">
           <Label className="text-xs sm:text-sm text-muted-foreground mb-1.5 block">
            จำนวนที่ใช้
           </Label>
           <Input
            type="number"
            min="1"
            max="9999"
            step="1"
            value={material.quantity_used}
            onChange={(e) => handleQuantityChange(index, e.target.value)}
            placeholder="ระบุจำนวน"
            disabled={disabled}
            className="text-base h-10"
           />
          </div>

          <div className="flex-1 text-right">
           <div className="text-xs sm:text-sm text-muted-foreground mb-1.5">
            รวม
           </div>
           <div className="text-base sm:text-lg font-semibold text-foreground">
            {materialInfo && material.quantity_used > 0
             ? formatQuantity(material.quantity_used, materialInfo.unit)
             : '-'
            }
           </div>
          </div>
         </div>
        </div>
       )
      })}
     </CardContent>
    </Card>
   )}

   {/* Add Material Section */}
   <Card>
    <CardHeader>
     <CardTitle className="text-lg flex items-center justify-between">
      เลือกวัตถุดิบ
      {!showMaterialList && (
       <Button
        onClick={() => setShowMaterialList(true)}
        disabled={disabled}
        size="sm"
       >
        <Plus className="h-4 w-4 mr-1" />
        เพิ่มวัตถุดิบ
       </Button>
      )}
     </CardTitle>
    </CardHeader>
    
    {showMaterialList && (
     <CardContent>
      <div className="space-y-4">
       {/* Search */}
       <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
         placeholder="ค้นหาวัตถุดิบ..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="pl-10"
         disabled={disabled}
        />
       </div>

       {/* Material List */}
       <div className="max-h-60 overflow-y-auto space-y-2">
        {filteredMaterials.length === 0 ? (
         <div className="text-center py-4 text-muted-foreground">
          {searchTerm ? 'ไม่พบวัตถุดิบที่ค้นหา' : 'ไม่มีวัตถุดิบที่สามารถเลือกได้'}
         </div>
        ) : (
         filteredMaterials.map((material) => (
          <div
           key={material.id}
           className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
           onClick={() => handleAddMaterial(material)}
          >
           <div>
            <div className="font-medium text-foreground">{formatMaterialName(material.name)}</div>
            <div className="text-sm text-muted-foreground">
             หน่วย: {formatUnit(material.unit)}
            </div>
           </div>
           <Button size="sm" variant="outline" disabled={disabled}>
            เลือก
           </Button>
          </div>
         ))
        )}
       </div>

       <div className="flex gap-2">
        <Button
         variant="outline"
         onClick={() => {
          setShowMaterialList(false)
          setSearchTerm('')
         }}
         disabled={disabled}
         className="flex-1"
        >
         ยกเลิก
        </Button>
       </div>
      </div>
     </CardContent>
    )}
   </Card>
  </div>
 )
}