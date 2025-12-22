"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Types for chart data
interface ChartDataPoint {
  date: string
  sales: number
  materialCost: number
}

interface SalesVsMaterialChartProps {
  salesData?: {
    dailyBreakdown?: Array<{
      date: string
      totalSales: number
    }>
  } | null
  materialData?: {
    dailyBreakdown?: Array<{
      date: string
      totalCost: number
    }>
  } | null
  isLoading?: boolean
}

const chartConfig = {
  sales: {
    label: "ยอดขาย",
    color: "hsl(var(--chart-1))",
  },
  materialCost: {
    label: "ต้นทุนวัตถุดิบ",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function SalesVsMaterialChart({
  salesData,
  materialData,
  isLoading = false
}: SalesVsMaterialChartProps) {
  const [timeRange, setTimeRange] = React.useState("30d")

  // Combine sales and material data by date
  const combinedData = React.useMemo(() => {
    if (!salesData?.dailyBreakdown && !materialData?.dailyBreakdown) {
      return []
    }

    const dataMap = new Map<string, ChartDataPoint>()

    // Add sales data
    salesData?.dailyBreakdown?.forEach((item) => {
      dataMap.set(item.date, {
        date: item.date,
        sales: item.totalSales,
        materialCost: 0
      })
    })

    // Add material cost data
    materialData?.dailyBreakdown?.forEach((item) => {
      const existing = dataMap.get(item.date)
      if (existing) {
        existing.materialCost = item.totalCost
      } else {
        dataMap.set(item.date, {
          date: item.date,
          sales: 0,
          materialCost: item.totalCost
        })
      }
    })

    // Convert to array and sort by date
    return Array.from(dataMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [salesData, materialData])

  // Filter data by time range
  const filteredData = React.useMemo(() => {
    if (combinedData.length === 0) return []

    const now = new Date()
    let daysToShow = 30

    if (timeRange === "7d") {
      daysToShow = 7
    } else if (timeRange === "90d") {
      daysToShow = 90
    }

    const cutoffDate = new Date(now.getTime() - daysToShow * 24 * 60 * 60 * 1000)

    return combinedData.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= cutoffDate
    })
  }, [combinedData, timeRange])

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    if (filteredData.length === 0) {
      return { totalSales: 0, totalCost: 0, profit: 0, profitMargin: 0 }
    }

    const totalSales = filteredData.reduce((sum, item) => sum + item.sales, 0)
    const totalCost = filteredData.reduce((sum, item) => sum + item.materialCost, 0)
    const profit = totalSales - totalCost
    const profitMargin = totalSales > 0 ? ((profit / totalSales) * 100) : 0

    return { totalSales, totalCost, profit, profitMargin }
  }, [filteredData])

  return (
    <Card className="border-border bg-background transition-colors duration-300">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-lg font-bold text-foreground">
            เปรียบเทียบยอดขายและต้นทุนวัตถุดิบ
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            แสดงความสัมพันธ์ระหว่างยอดขายและต้นทุนวัตถุดิบ
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Summary Stats */}
          <div className="hidden lg:flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">กำไรรวม: </span>
              <span className={`font-semibold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ฿{summary.profit.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Margin: </span>
              <span className={`font-semibold ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg border-border text-foreground"
              aria-label="เลือกช่วงเวลา"
            >
              <SelectValue placeholder="30 วันล่าสุด" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                90 วันล่าสุด
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 วันล่าสุด
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 วันล่าสุด
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="h-[250px] w-full flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-[250px] bg-muted rounded-lg"></div>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="h-[250px] w-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
              <p className="text-xs mt-1">ลองเลือกช่วงเวลาอื่นหรือรีเฟรชข้อมูล</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Summary Stats */}
            <div className="lg:hidden mb-4 grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground block text-xs">กำไรรวม</span>
                <span className={`font-semibold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ฿{summary.profit.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground block text-xs">Profit Margin</span>
                <span className={`font-semibold ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>

            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-sales)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-sales)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillMaterialCost" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-materialCost)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-materialCost)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("th-TH", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      }}
                      formatter={(value, name) => {
                        return [
                          `฿${Number(value).toLocaleString()}`,
                          name === 'sales' ? 'ยอดขาย' : 'ต้นทุนวัตถุดิบ'
                        ]
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="materialCost"
                  type="natural"
                  fill="url(#fillMaterialCost)"
                  stroke="var(--color-materialCost)"
                  strokeWidth={2}
                  stackId="a"
                />
                <Area
                  dataKey="sales"
                  type="natural"
                  fill="url(#fillSales)"
                  stroke="var(--color-sales)"
                  strokeWidth={2}
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}
