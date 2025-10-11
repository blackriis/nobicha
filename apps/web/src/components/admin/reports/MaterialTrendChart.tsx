'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Type definition for monthly trend data
export interface MonthlyTrendData {
  month: string // Format: "YYYY-MM"
  monthLabel: string // Display label: "ม.ค. 2025"
  totalCost: number
  totalUsageCount: number
  uniqueMaterialsUsed: number
}

interface MaterialTrendChartProps {
  data: MonthlyTrendData[]
  isLoading?: boolean
  selectedPeriod?: 'last3months' | 'last6months' | 'last12months'
  onPeriodChange?: (period: 'last3months' | 'last6months' | 'last12months') => void
}

// Helper to format currency
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `฿${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `฿${(value / 1000).toFixed(1)}K`
  }
  return `฿${value.toFixed(0)}`
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="border-border bg-background/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-3 space-y-2">
          <p className="font-semibold text-sm">{payload[0].payload.monthLabel}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">ต้นทุนรวม:</span>
              <span className="text-sm font-semibold text-primary">
                ฿{payload[0].value.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">จำนวนการใช้:</span>
              <span className="text-sm font-semibold">
                {payload[1].value} ครั้ง
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">วัตถุดิบที่ใช้:</span>
              <span className="text-sm font-semibold">
                {payload[0].payload.uniqueMaterialsUsed} รายการ
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  return null
}

export function MaterialTrendChart({
  data,
  isLoading = false,
  selectedPeriod = 'last3months',
  onPeriodChange
}: MaterialTrendChartProps) {

  // Calculate trend comparison (current month vs previous month)
  const trendAnalysis = useMemo(() => {
    if (data.length < 2) return null

    const currentMonth = data[data.length - 1]
    const previousMonth = data[data.length - 2]

    const costChange = currentMonth.totalCost - previousMonth.totalCost
    const costChangePercent = (costChange / previousMonth.totalCost) * 100
    const usageChange = currentMonth.totalUsageCount - previousMonth.totalUsageCount
    const usageChangePercent = (usageChange / previousMonth.totalUsageCount) * 100

    return {
      costChange,
      costChangePercent,
      usageChange,
      usageChangePercent,
      isIncreasing: costChange > 0
    }
  }, [data])

  // Calculate average values
  const averages = useMemo(() => {
    if (data.length === 0) return { avgCost: 0, avgUsage: 0 }

    const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0)
    const totalUsage = data.reduce((sum, item) => sum + item.totalUsageCount, 0)

    return {
      avgCost: totalCost / data.length,
      avgUsage: totalUsage / data.length
    }
  }, [data])

  if (isLoading) {
    return (
      <Card className="border-border bg-background shadow-sm">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-border bg-background shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            แนวโน้มการใช้วัตถุดิบรายเดือน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Activity className="h-12 w-12 mb-3" />
            <p>ไม่มีข้อมูลแนวโน้มในช่วงเวลานี้</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-background shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                แนวโน้มการใช้วัตถุดิบรายเดือน
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                เปรียบเทียบต้นทุนและการใช้งานย้อนหลัง
              </p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2">
            <Button
              variant={selectedPeriod === 'last3months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange?.('last3months')}
              className="text-xs"
            >
              3 เดือน
            </Button>
            <Button
              variant={selectedPeriod === 'last6months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange?.('last6months')}
              className="text-xs"
            >
              6 เดือน
            </Button>
            <Button
              variant={selectedPeriod === 'last12months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange?.('last12months')}
              className="text-xs"
            >
              12 เดือน
            </Button>
          </div>
        </div>

        {/* Trend indicators */}
        {trendAnalysis && (
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
              {trendAnalysis.isIncreasing ? (
                <TrendingUp className="h-4 w-4 text-orange-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <div className="text-xs">
                <span className="text-muted-foreground">ต้นทุนเดือนนี้:</span>
                <span className={`ml-1 font-semibold ${trendAnalysis.isIncreasing ? 'text-orange-500' : 'text-green-500'}`}>
                  {trendAnalysis.isIncreasing ? '+' : ''}{trendAnalysis.costChangePercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
              <Activity className="h-4 w-4" />
              <div className="text-xs">
                <span className="text-muted-foreground">การใช้เดือนนี้:</span>
                <span className="ml-1 font-semibold">
                  {trendAnalysis.usageChange > 0 ? '+' : ''}{trendAnalysis.usageChangePercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <Badge variant="secondary">
              เฉลี่ย {formatCurrency(averages.avgCost)}/เดือน
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="monthLabel"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="totalCost"
              name="ต้นทุนรวม (บาท)"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCost)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="totalUsageCount"
              name="จำนวนการใช้ (ครั้ง)"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUsage)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
