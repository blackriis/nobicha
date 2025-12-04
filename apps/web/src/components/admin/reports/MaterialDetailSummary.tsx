'use client'

import {
 Package,
 DollarSign,
 Building2,
 Users,
 TrendingUp,
 Hash
} from 'lucide-react'
import { adminReportsService } from '@/lib/services/admin-reports.service'
import { designTokens } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

interface MaterialDetailSummaryProps {
 summary: {
  totalCost: number
  totalUsageCount: number
  uniqueMaterials: number
  uniqueBranches: number
  uniqueEmployees: number
  averageCostPerUsage: number
  topMaterial: string | null
  topMaterialCost: number
 } | null
 isLoading: boolean
}

export function MaterialDetailSummary({ summary, isLoading }: MaterialDetailSummaryProps) {
 if (isLoading) {
  return (
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
     <div key={index} className={cn(
      "relative bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-sm",
      "border border-border/50 rounded-2xl p-6 overflow-hidden"
     )}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-10 -mt-10"></div>
      <div className="relative">
       <div className="animate-pulse">
        <div className="h-3 bg-muted/50 rounded-lg w-2/3 mb-3"></div>
        <div className="h-8 bg-muted/50 rounded-xl w-1/2 mb-2"></div>
        <div className="h-2 bg-muted/30 rounded-lg w-full"></div>
       </div>
      </div>
     </div>
    ))}
   </div>
  )
 }

 if (!summary) {
  return (
   <div className={cn(
    "relative bg-gradient-to-br from-background via-background to-muted/30 backdrop-blur-sm",
    "border-2 border-dashed border-border/50 rounded-3xl p-12 text-center"
   )}>
    <div className="max-w-md mx-auto">
     <div className={cn(
      "w-20 h-20 bg-gradient-to-br from-muted/50 to-muted/20 rounded-2xl",
      "flex items-center justify-center mx-auto mb-6"
     )}>
      <Package className="h-10 w-10 text-muted-foreground/60" />
     </div>
     <h3 className="text-lg font-medium text-foreground mb-3">ไม่มีข้อมูลวัตถุดิบ</h3>
     <p className="text-muted-foreground mb-6">ไม่พบข้อมูลการใช้วัตถุดิบในช่วงเวลาที่เลือก</p>
     <details className="text-xs text-muted-foreground/60 bg-muted/20 rounded-xl p-4 max-w-sm mx-auto">
      <summary className="cursor-pointer font-medium mb-2 hover:text-foreground">ข้อมูล Debug</summary>
      <div className="text-left space-y-1">
       <p>• ตรวจสอบ Browser Console</p>
       <p>• ตรวจสอบ Network Tab</p>
       <p>• Summary: {JSON.stringify(summary)}</p>
       <p>• Loading: {isLoading ? 'true' : 'false'}</p>
      </div>
     </details>
    </div>
   </div>
  )
 }

 const summaryCards = [
  {
   title: 'ต้นทุนรวม',
   value: adminReportsService.formatCurrency(summary.totalCost),
   icon: DollarSign,
   description: 'ต้นทุนวัตถุดิบทั้งหมด'
  },
  {
   title: 'การใช้งานทั้งหมด',
   value: summary.totalUsageCount.toLocaleString(),
   suffix: 'ครั้ง',
   icon: Hash,
   description: 'จำนวนครั้งที่ใช้วัตถุดิบ'
  },
  {
   title: 'วัตถุดิบที่ใช้',
   value: summary.uniqueMaterials.toString(),
   suffix: 'รายการ',
   icon: Package,
   description: 'จำนวนชนิดวัตถุดิบ'
  },
  {
   title: 'สาขาที่เกี่ยวข้อง',
   value: summary.uniqueBranches.toString(),
   suffix: 'สาขา',
   icon: Building2,
   description: 'จำนวนสาขาที่ใช้วัตถุดิบ'
  },
  {
   title: 'พนักงานที่เกี่ยวข้อง',
   value: summary.uniqueEmployees.toString(),
   suffix: 'คน',
   icon: Users,
   description: 'จำนวนพนักงานที่ใช้วัตถุดิบ'
  },
  {
   title: 'ต้นทุนเฉลี่ยต่อครั้ง',
   value: adminReportsService.formatCurrency(summary.averageCostPerUsage),
   icon: TrendingUp,
   description: 'ต้นทุนเฉลี่ยต่อการใช้งาน'
  }
 ]

 return (
  <div className="space-y-8">
   {/* Summary Cards Grid */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
    {summaryCards.map((card, index) => {
     const IconComponent = card.icon

     return (
      <div key={index} className={cn(
       "group relative bg-gradient-to-br from-background via-background to-muted/10 backdrop-blur-sm",
       "border border-border/30 rounded-2xl p-6 overflow-hidden"
      )}>
       {/* Decorative gradient */}
       <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/8 to-transparent rounded-full -mr-12 -mt-12"></div>
       
       {/* Icon background */}
       <div className={cn(
        "w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl",
        "flex items-center justify-center mb-4"
       )}>
        <IconComponent className="h-6 w-6 text-primary" />
       </div>
       
       {/* Title */}
       <h3 className="text-sm font-medium text-muted-foreground mb-3">
        {card.title}
       </h3>
       
       {/* Value and suffix */}
       <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl xl:text-3xl font-bold text-foreground">
         {card.value}
        </span>
        {card.suffix && (
         <span className="text-sm text-muted-foreground/70 font-medium">
          {card.suffix}
         </span>
        )}
       </div>
       
       {/* Description */}
       <p className="text-xs text-muted-foreground/60 leading-relaxed">
        {card.description}
       </p>
      </div>
     )
    })}
   </div>

   {/* Top Material Highlight */}
   {summary.topMaterial && (
    <div className={cn(
     "relative bg-gradient-to-r from-primary/5 via-background to-accent/5 backdrop-blur-sm",
     "border border-border/40 rounded-3xl p-8 overflow-hidden"
    )}>
     <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -ml-16 -mt-16"></div>
     <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-accent/10 to-transparent rounded-full -mr-12 -mb-12"></div>
     
     <div className="relative">
      <div className="flex items-center gap-6">
       <div className={cn(
        "w-16 h-16 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl",
        "flex items-center justify-center"
       )}>
        <Package className="h-8 w-8 text-primary" />
       </div>
       
       <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
         <h3 className="text-xl font-semibold text-foreground">วัตถุดิบที่ใช้มากที่สุด</h3>
         <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
          สูงสุด
         </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
         <span className="font-medium text-foreground">{summary.topMaterial}</span>
         <span className="text-muted-foreground/60">•</span>
         <span className="text-muted-foreground">ต้นทุน {adminReportsService.formatCurrency(summary.topMaterialCost)}</span>
        </div>
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}
