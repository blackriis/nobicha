'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
 materialUsageService,
 type MaterialUsageRecord 
} from '@/lib/services/material-usage.service'
import { 
 formatQuantity,
 calculateTotalCost,
 groupMaterialUsageByMaterial,
 formatMaterialName,
 formatUnit
} from '@/lib/utils/material-usage.utils'
import { useAuth } from '@/components/auth/AuthProvider'
import { Package, Calculator, Clock } from 'lucide-react'

interface UsageSummaryProps {
 records: MaterialUsageRecord[]
 showTotal?: boolean
 compact?: boolean
}

export function UsageSummary({ 
 records, 
 showTotal = true,
 compact = false 
}: UsageSummaryProps) {
 const { user } = useAuth()
 
 if (!records || records.length === 0) {
  return (
   <Card>
    <CardContent className="p-6">
     <div className="text-center text-gray-500">
      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>ยังไม่มีการรายงานการใช้วัตถุดิบ</p>
     </div>
    </CardContent>
   </Card>
  )
 }

 const userRole = user?.profile?.role
 calculateTotalCost(records, userRole) // Calculate but don't store since not used
 const materialSummaries = groupMaterialUsageByMaterial(records, userRole)
 const showCostInfo = false // Always hide cost info for employees

 if (compact) {
  return (
   <Card>
    <CardContent className="p-4">
     <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
       <span className="text-gray-600">วัตถุดิบทั้งหมด:</span>
       <span className="font-medium">{materialSummaries.length} รายการ</span>
      </div>
      {showTotal && showCostInfo && (
       <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">ต้นทุนรวม:</span>
        <span className="font-semibold text-blue-600">
         {materialUsageService.formatCurrency(materialUsageService.calculateTotalCost(records, userRole))}
        </span>
       </div>
      )}
     </div>
    </CardContent>
   </Card>
  )
 }

 return (
  <div className="space-y-4">
   {/* Summary Cards */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
    <Card>
     <CardContent className="p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
       <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
       </div>
       <div>
        <div className="text-xs sm:text-sm text-muted-foreground">วัตถุดิบทั้งหมด</div>
        <div className="text-lg sm:text-xl font-semibold text-foreground">{materialSummaries.length} รายการ</div>
       </div>
      </div>
     </CardContent>
    </Card>

    {showTotal && showCostInfo && (
     <Card>
      <CardContent className="p-3 sm:p-4">
       <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-950/50 rounded-lg shrink-0">
         <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
         <div className="text-xs sm:text-sm text-muted-foreground">ต้นทุนรวม</div>
         <div className="text-lg sm:text-xl font-semibold text-green-600 dark:text-green-400">
          {materialUsageService.formatCurrency(materialUsageService.calculateTotalCost(records, userRole))}
         </div>
        </div>
       </div>
      </CardContent>
     </Card>
    )}
   </div>

   {/* Material Details */}
   <Card>
    <CardHeader className="pb-3">
     <CardTitle className="text-base sm:text-lg flex items-center gap-2">
      <Package className="h-4 w-4 sm:h-5 sm:w-5" />
      รายละเอียดการใช้วัตถุดิบ
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className="space-y-2 sm:space-y-3">
      {materialSummaries.map((summary) => (
       <div
        key={summary.material_id}
        className="border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors"
       >
        <div className="p-3 sm:p-4">
         {/* Material Name */}
         <div className="font-medium text-sm sm:text-base mb-1 text-foreground">
          {formatMaterialName(summary.material_name)}
         </div>

         {/* Info Row */}
         <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
           <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5">
            <div>หน่วย: {formatUnit(summary.unit)}</div>
            {showCostInfo && (
             <div>ราคา: {materialUsageService.formatCurrency(summary.cost_per_unit)} ต่อ {formatUnit(summary.unit)}</div>
            )}
            {summary.usage_count > 1 && (
             <div className="text-primary font-medium">
              ใช้ {summary.usage_count} ครั้ง
             </div>
            )}
           </div>
          </div>

          {/* Quantity Display */}
          <div className="text-right shrink-0">
           <div className="text-base sm:text-lg font-semibold text-foreground">
            {formatQuantity(summary.total_quantity, summary.unit)}
           </div>
           {showTotal && showCostInfo && (
            <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-semibold mt-0.5">
             {materialUsageService.formatCurrency(summary.total_cost)}
            </div>
           )}
          </div>
         </div>
        </div>
       </div>
      ))}
     </div>
    </CardContent>
   </Card>

   {/* Timeline Details (if records have timestamps) */}
   {records.length > 1 && (
    <Card>
     <CardHeader className="pb-3">
      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
       <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
       ลำดับเวลาการรายงาน
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className="space-y-2">
       {records
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((record, index) => (
         <div key={record.id} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm shrink-0">
           {index + 1}
          </div>
          <div className="flex-1 min-w-0">
           <div className="font-medium truncate">{formatMaterialName(record.raw_materials.name)}</div>
           <div className="text-muted-foreground mt-0.5">
            {formatQuantity(record.quantity_used, record.raw_materials.unit)}
           </div>
          </div>
          <div className="text-muted-foreground text-xs shrink-0">
           {materialUsageService.formatDateShort(record.created_at)}
          </div>
         </div>
        ))}
      </div>
     </CardContent>
    </Card>
   )}
  </div>
 )
}