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
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card>
     <CardContent className="p-4">
      <div className="flex items-center gap-3">
       <div className="p-2 bg-primary/10 rounded-lg">
        <Package className="h-5 w-5 text-primary" />
       </div>
       <div>
        <div className="text-sm text-muted-foreground">วัตถุดิบทั้งหมด</div>
        <div className="text-xl font-semibold text-foreground">{materialSummaries.length} รายการ</div>
       </div>
      </div>
     </CardContent>
    </Card>

    {showTotal && showCostInfo && (
     <Card>
      <CardContent className="p-4">
       <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-950/50 rounded-lg">
         <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
         <div className="text-sm text-muted-foreground">ต้นทุนรวม</div>
         <div className="text-xl font-semibold text-green-600 dark:text-green-400">
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
    <CardHeader>
     <CardTitle className="text-lg flex items-center gap-2">
      <Package className="h-5 w-5" />
      รายละเอียดการใช้วัตถุดิบ
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className="space-y-3">
      {materialSummaries.map((summary) => (
       <div
        key={summary.material_id}
        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
       >
        <div className="flex-1">
         <div className="font-medium">{formatMaterialName(summary.material_name)}</div>
         <div className="text-sm text-gray-500">
          หน่วย: {formatUnit(summary.unit)}
          {showCostInfo && (
           <span> | ราคา: {materialUsageService.formatCurrency(summary.cost_per_unit)} ต่อ {formatUnit(summary.unit)}</span>
          )}
          {summary.usage_count > 1 && (
           <span className="ml-2 text-blue-600">
            (ใช้ {summary.usage_count} ครั้ง)
           </span>
          )}
         </div>
        </div>
        
        <div className="text-right">
         <div className="font-medium">
          {formatQuantity(summary.total_quantity, summary.unit)}
         </div>
         {showTotal && showCostInfo && (
          <div className="text-sm text-green-600 font-semibold">
           {materialUsageService.formatCurrency(summary.total_cost)}
          </div>
         )}
        </div>
       </div>
      ))}
     </div>
    </CardContent>
   </Card>

   {/* Timeline Details (if records have timestamps) */}
   {records.length > 1 && (
    <Card>
     <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
       <Clock className="h-5 w-5" />
       ลำดับเวลาการรายงาน
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className="space-y-2">
       {records
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((record, index) => (
         <div key={record.id} className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
           {index + 1}
          </div>
          <div className="flex-1">
           <span className="font-medium">{formatMaterialName(record.raw_materials.name)}</span>
           <span className="text-gray-500 ml-2">
            {formatQuantity(record.quantity_used, record.raw_materials.unit)}
           </span>
          </div>
          <div className="text-gray-500">
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