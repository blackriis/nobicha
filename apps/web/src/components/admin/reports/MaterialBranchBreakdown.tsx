'use client'

import {
 Building2,
 DollarSign,
 Star
} from 'lucide-react'
import { adminReportsService } from '@/lib/services/admin-reports.service'
import { cn } from '@/lib/utils'
import { designTokens } from '@/lib/design-tokens'

interface MaterialBranchBreakdownProps {
 branches: Array<{
  branchId: string
  branchName: string
  totalCost: number
  usageCount: number
  materials: string[]
  materialIds: string[]
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
   <div className={cn(
    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    "gap-4 md:gap-6"
   )}>
    {Array.from({ length: 4 }).map((_, index) => (
     <div key={index} className={cn(
      "relative bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-sm",
      "border border-border/50",
      designTokens.borderRadius.xl,
      designTokens.components.card.padding.default,
      "overflow-hidden",
      designTokens.animations.transition.default
     )}>
      <div className={cn(
       "absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent",
       designTokens.borderRadius.full,
       "-mr-10 -mt-10"
      )}></div>
      <div className={cn("space-y-4", designTokens.spacing[4])}>
       <div className="animate-pulse">
        <div className={cn(
         "h-5 bg-muted/50",
         designTokens.borderRadius.xl,
         "w-3/4 mb-3"
        )}></div>
        <div className={cn(
         "h-4 bg-muted/40",
         designTokens.borderRadius.lg,
         "w-1/2"
        )}></div>
       </div>
       <div className={cn("space-y-3 animate-pulse", designTokens.spacing[3])}>
        <div className={cn(
         "h-16 bg-muted/30",
         designTokens.borderRadius.xl
        )}></div>
        <div className={cn(
         "h-12 bg-muted/30",
         designTokens.borderRadius.xl
        )}></div>
        <div className={cn(
         "h-8 bg-muted/20",
         designTokens.borderRadius.lg
        )}></div>
       </div>
      </div>
     </div>
    ))}
   </div>
  )
 }

 if (!branches || branches.length === 0) {
  return (
   <div className={cn(
    "relative bg-gradient-to-br from-background via-background to-muted/30 backdrop-blur-sm",
    "border-2 border-dashed border-border/50",
    designTokens.borderRadius.full,
    designTokens.components.card.padding.lg,
    "text-center",
    "hover:border-border/80 hover:bg-muted/10",
    designTokens.animations.transition.slow
   )}>
    <div className="max-w-md mx-auto">
     <div className={cn(
      "w-20 h-20 bg-gradient-to-br from-muted/50 to-muted/20",
      designTokens.borderRadius.xl,
      "flex items-center justify-center mx-auto mb-6",
      designTokens.animations.transition.default
     )}>
      <Building2 className="h-10 w-10 text-muted-foreground/60" />
     </div>
     <h3 className={cn(
      designTokens.typography.fontSize.lg,
      designTokens.typography.fontWeight.medium,
      "text-foreground mb-3"
     )}>
      ไม่มีข้อมูลสาขา
     </h3>
     <p className={cn(
      designTokens.typography.fontSize.base,
      "text-muted-foreground"
     )}>
      ไม่พบข้อมูลการใช้วัตถุดิบตามสาขาในช่วงเวลาที่เลือก
     </p>
    </div>
   </div>
  )
 }

 // Calculate totals for progress bars
 const maxCost = Math.max(...branches.map(b => b.totalCost))
 const maxUsage = Math.max(...branches.map(b => b.usageCount))

 return (
  <div className={cn(
   "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
   "gap-4 md:gap-6"
  )}>
   {branches.map((branch) => {
    const isSelected = selectedBranchId === branch.branchId
    const isTopCost = branch.totalCost === maxCost
    const isTopUsage = branch.usageCount === maxUsage
    const isMostEfficient = branch.averageCostPerUsage === Math.min(...branches.map(b => b.averageCostPerUsage))

    return (
     <div
      key={branch.branchId}
      onClick={() => onBranchClick(branch.branchId)}
      className={cn(
       "group relative bg-gradient-to-br from-background via-background to-muted/10 backdrop-blur-sm",
       "border border-border/30 cursor-pointer overflow-hidden",
       designTokens.borderRadius.xl,
       designTokens.components.card.padding.default,
       "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1",
       designTokens.animations.transition.slow,
       isSelected && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
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
      {/* Decorative gradients */}
      <div className={cn(
       "absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/8 to-transparent",
       designTokens.borderRadius.full,
       "-mr-12 -mt-12 opacity-0 group-hover:opacity-100",
       designTokens.animations.transition.default
      )}></div>
      {isSelected && (
       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/2 pointer-events-none"></div>
      )}
      
      {/* Header */}
      <div className="relative">
       <div className={cn("flex items-center gap-3 mb-4", designTokens.spacing[4])}>
        <div className={cn(
         "w-12 h-12 flex items-center justify-center",
         designTokens.borderRadius.xl,
         designTokens.animations.transition.default,
         isSelected
          ? "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 scale-110"
          : "bg-gradient-to-br from-primary/10 to-primary/5 group-hover:scale-105 group-hover:from-primary/15"
        )}>
         <Building2 className={cn(
          "h-6 w-6",
          designTokens.animations.transition.default,
          isSelected ? "text-white" : "text-primary"
         )} />
        </div>
        <div className="flex-1">
         <div className={cn("flex items-center gap-2", designTokens.spacing[2])}>
          <h3 className={cn(
           designTokens.typography.fontSize.lg,
           designTokens.typography.fontWeight.semibold,
           designTokens.animations.transition.default,
           isSelected ? "text-foreground" : "text-foreground group-hover:text-primary"
          )}>
           {branch.branchName}
          </h3>
          {isSelected && (
           <div className={cn(
            "px-2 py-1 bg-primary/10 text-primary",
            designTokens.borderRadius.full,
            designTokens.typography.fontSize.xs,
            designTokens.typography.fontWeight.medium
           )}>
            เลือกอยู่
           </div>
          )}
         </div>
        </div>
       </div>
      </div>
     
      {/* Total Cost Metric */}
      <div className={cn("relative space-y-4", designTokens.spacing[4])}>
       <div className={cn(
        "p-6 border border-border/20 bg-gradient-to-br from-green-50/10 to-green-50/0",
        designTokens.borderRadius.xl,
        "group-hover:border-green-200/40 group-hover:from-green-50/15 group-hover:to-green-50/5",
        designTokens.animations.transition.default
       )}>
        <div className={cn("flex items-center justify-between", designTokens.spacing[4])}>
         <div className={cn("flex items-center gap-3", designTokens.spacing[3])}>
          <div className={cn(
           "w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 shadow-lg",
           designTokens.borderRadius.xl,
           "flex items-center justify-center group-hover:scale-110",
           designTokens.animations.transition.default
          )}>
           <DollarSign className="h-7 w-7 text-white" />
          </div>
          <div>
           <p className={cn(
            designTokens.typography.fontSize.sm,
            designTokens.typography.fontWeight.medium,
            "text-muted-foreground mb-1"
           )}>
            ต้นทุนรวม
           </p>
           <p className={cn(
            designTokens.typography.fontSize['2xl'],
            designTokens.typography.fontWeight.bold,
            designTokens.colors.success.text
           )}>
            {adminReportsService.formatCurrency(branch.totalCost)}
           </p>
          </div>
         </div>
         
         {isTopCost && (
          <div className={cn(
           "px-3 py-1 bg-gradient-to-r from-green-100/50 to-green-100/20 border border-green-200/50 flex items-center gap-1",
           designTokens.borderRadius.full,
           designTokens.spacing[1]
          )}>
           <Star className={cn("h-4 w-4", designTokens.colors.success.text)} />
           <span className={cn(
            designTokens.typography.fontSize.xs,
            designTokens.typography.fontWeight.medium,
            "text-green-700"
           )}>
            สูงสุด
           </span>
          </div>
         )}
        </div>
        
        {/* Progress Bar */}
        <div className={cn("mt-4", designTokens.spacing[4])}>
         <div className={cn(
          "w-full bg-green-100/20 overflow-hidden",
          designTokens.borderRadius.full,
          "h-3"
         )}>
          <div 
           className={cn(
            "bg-gradient-to-r from-green-500 to-green-600 h-3",
            designTokens.borderRadius.full,
            designTokens.animations.transition.slow
           )} 
           style={{ width: `${(branch.totalCost / maxCost) * 100}%` }}
          ></div>
         </div>
        </div>
       </div>
      </div>
     </div>
    )
   })}
  </div>
 )
}