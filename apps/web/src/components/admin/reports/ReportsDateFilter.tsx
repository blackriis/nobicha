'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, CalendarDays, Clock, Filter } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import type { DateRangeFilter } from '@/lib/services/admin-reports.service'
import type { DateRange } from 'react-day-picker'

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
  const [dateRangePickerValue, setDateRangePickerValue] = useState<DateRange | undefined>(() => {
    if (selectedRange.type === 'custom' && selectedRange.startDate && selectedRange.endDate) {
      return {
        from: new Date(selectedRange.startDate),
        to: new Date(selectedRange.endDate)
      }
    }
    return undefined
  })

  // Track screen size for responsive calendar
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const dateRangeOptions = [
    {
      label: 'วันนี้',
      value: 'today' as const,
      icon: CalendarIcon
    },
    {
      label: 'สัปดาห์นี้',
      value: 'week' as const,
      icon: CalendarDays
    },
    {
      label: 'เดือนนี้',
      value: 'month' as const,
      icon: Clock
    }
  ]

  const handleRangeSelect = (type: DateRangeFilter['type']) => {
    onRangeChange({ type })
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRangePickerValue(range)
    if (range?.from && range?.to) {
      onRangeChange({
        type: 'custom',
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd')
      })
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
        if (dateRangePickerValue?.from && dateRangePickerValue?.to) {
          return `${format(dateRangePickerValue.from, 'dd MMM yyyy', { locale: th })} - ${format(dateRangePickerValue.to, 'dd MMM yyyy', { locale: th })}`
        }
        return 'เลือกช่วงวันที่'
      default:
        return 'เลือกช่วงเวลา'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-lg">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">ช่วงเวลาในการดูรายงาน</h2>
            <p className="text-sm text-muted-foreground">
              เลือกช่วงเวลาสำหรับแสดงข้อมูลรายงาน
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{getSelectedRangeLabel()}</span>
        </Badge>
      </div>

      {/* Filter Options */}
      <div className="bg-card dark:bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {dateRangeOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedRange.type === option.value

            return (
              <Button
                key={option.value}
                variant={isSelected ? "default" : "outline"}
                onClick={() => handleRangeSelect(option.value)}
                disabled={isLoading}
                size="sm"
                className={cn(
                  "gap-2 font-medium",
                  isSelected 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground" 
                    : "bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </Button>
            )
          })}

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={selectedRange.type === 'custom' ? "default" : "outline"}
                size="sm"
                disabled={isLoading}
                className={cn(
                  "gap-2 font-medium min-w-[180px] justify-start",
                  selectedRange.type === 'custom'
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground"
                    : "bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {selectedRange.type === 'custom' && dateRangePickerValue?.from && dateRangePickerValue?.to
                  ? `${format(dateRangePickerValue.from, 'dd MMM', { locale: th })} - ${format(dateRangePickerValue.to, 'dd MMM', { locale: th })}`
                  : 'เลือกช่วงวันที่'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-card dark:bg-card border-border"
              align="end"
            >
              <Calendar
                mode="range"
                selected={dateRangePickerValue}
                onSelect={handleDateRangeSelect}
                numberOfMonths={isMobile ? 1 : 2}
                locale={th}
                disabled={isLoading}
                className="bg-card dark:bg-card"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
