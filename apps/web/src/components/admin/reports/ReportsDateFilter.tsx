'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CalendarDays, Clock, Filter, Activity } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DateRangeFilter } from '@/lib/services/admin-reports.service'

interface ReportsDateFilterProps {
  selectedRange: DateRangeFilter
  onRangeChange: (range: DateRangeFilter) => void
  isLoading?: boolean
}

export function ReportsDateFilter({ 
  selectedRange, 
  onRangeChange, 
  isLoading = false 
}: ReportsDateFilterProps) {
  const [showCustomDates, setShowCustomDates] = useState(selectedRange.type === 'custom')

  const dateRangeOptions = [
    {
      label: 'ทั้งหมด',
      value: 'all' as const,
      icon: Activity,
      description: 'ข้อมูลทั้งหมดในระบบ'
    },
    {
      label: 'วันนี้',
      value: 'today' as const,
      icon: Calendar,
      description: 'ข้อมูลวันปัจจุบัน'
    },
    {
      label: 'สัปดาห์นี้',
      value: 'week' as const,
      icon: CalendarDays,
      description: '7 วันย้อนหลัง'
    },
    {
      label: 'เดือนนี้',
      value: 'month' as const,
      icon: Clock,
      description: '30 วันย้อนหลัง'
    },
    {
      label: 'กำหนดเอง',
      value: 'custom' as const,
      icon: Filter,
      description: 'เลือกช่วงเวลาเอง'
    }
  ]

  const handleRangeSelect = (type: DateRangeFilter['type']) => {
    if (type === 'custom') {
      setShowCustomDates(true)
      // Set default custom range (last 30 days)
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      onRangeChange({
        type: 'custom',
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      })
    } else {
      setShowCustomDates(false)
      onRangeChange({ type })
    }
  }

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (selectedRange.type === 'custom') {
      onRangeChange({
        ...selectedRange,
        [field]: value
      })
    }
  }

  const formatDisplayDate = (date: string): string => {
    try {
      return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return date
    }
  }

  const getSelectedRangeLabel = (): string => {
    switch (selectedRange.type) {
      case 'today':
        return 'วันนี้'
      case 'week':
        return 'สัปดาห์นี้'
      case 'month':
        return 'เดือนนี้'
      case 'custom':
        if (selectedRange.startDate && selectedRange.endDate) {
          return `${formatDisplayDate(selectedRange.startDate)} - ${formatDisplayDate(selectedRange.endDate)}`
        }
        return 'กำหนดเอง'
      default:
        return 'เลือกช่วงเวลา'
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">ช่วงเวลาในการดูรายงาน</CardTitle>
              <p className="text-sm text-muted-foreground">
                เลือกช่วงเวลาสำหรับแสดงข้อมูลรายงาน
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {getSelectedRangeLabel()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Range Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {dateRangeOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedRange.type === option.value
            
            return (
              <Button
                key={option.value}
                variant={isSelected ? "default" : "outline"}
                onClick={() => handleRangeSelect(option.value)}
                disabled={isLoading}
                className={`h-auto p-4 flex flex-col items-center gap-2 ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs opacity-75">{option.description}</div>
                </div>
              </Button>
            )
          })}
        </div>

        {/* Custom Date Inputs */}
        {showCustomDates && selectedRange.type === 'custom' && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-medium">
                  วันที่เริ่มต้น
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={selectedRange.startDate || ''}
                  onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-medium">
                  วันที่สิ้นสุด
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={selectedRange.endDate || ''}
                  onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
            </div>
            
            {selectedRange.startDate && selectedRange.endDate && (
              <div className="mt-3 text-sm text-muted-foreground">
                ช่วงเวลาที่เลือก: {formatDisplayDate(selectedRange.startDate)} ถึง {formatDisplayDate(selectedRange.endDate)}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            💡 เคล็ดลับ: เลือกช่วงเวลาที่เหมาะสมเพื่อข้อมูลที่แม่นยำ
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}