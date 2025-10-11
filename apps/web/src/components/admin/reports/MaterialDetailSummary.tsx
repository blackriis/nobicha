'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  DollarSign,
  Building2,
  Users,
  TrendingUp,
  Hash
} from 'lucide-react'
import { adminReportsService } from '@/lib/services/admin-reports.service'

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="bg-background text-foreground border-border transition-colors duration-300 hover:bg-muted hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!summary) {
    return (
      <Card className="bg-background text-foreground border-border border-dashed border-2 transition-colors duration-300 hover:bg-muted hover:shadow-md">
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">ไม่มีข้อมูลวัตถุดิบในช่วงเวลาที่เลือก</p>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer mb-2">ข้อมูล Debug</summary>
            <p>ตรวจสอบ Browser Console และ Network Tab สำหรับข้อมูลเพิ่มเติม</p>
            <p>Summary data: {JSON.stringify(summary)}</p>
            <p>Loading state: {isLoading ? 'true' : 'false'}</p>
          </details>
        </CardContent>
      </Card>
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
    <div className="space-y-6">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {summaryCards.map((card, index) => {
          const IconComponent = card.icon

          return (
            <Card key={index} className="bg-background text-foreground border-border transition-colors duration-300 hover:bg-muted hover:shadow-md hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-muted text-foreground/80 shadow-sm transition-colors duration-300">
                    <IconComponent className="h-5 w-5 transition-colors duration-300" />
                  </div>
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground mt-3 transition-colors duration-300">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl lg:text-3xl font-bold text-foreground transition-colors duration-300">
                    {card.value}
                  </span>
                  {card.suffix && (
                    <span className="text-sm text-muted-foreground font-medium transition-colors duration-300">
                      {card.suffix}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed transition-colors duration-300">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Top Material Highlight */}
      {summary.topMaterial && (
        <Card className="bg-gradient-to-r from-muted/50 to-accent/10 bg-background text-foreground border-border transition-colors duration-300 hover:bg-muted hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted text-foreground/80 rounded-full transition-colors duration-300">
                <Package className="h-6 w-6 transition-colors duration-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground transition-colors duration-300">วัตถุดิบที่ใช้มากที่สุด</h3>
                <p className="text-sm text-muted-foreground mt-1 transition-colors duration-300">
                  <span className="font-medium">{summary.topMaterial}</span> •
                  ต้นทุน {adminReportsService.formatCurrency(summary.topMaterialCost)}
                </p>
              </div>
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-border">
                สูงสุด
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
