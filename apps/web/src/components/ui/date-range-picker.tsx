"use client"

import * as React from "react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type DateRange = {
 from: Date | undefined
 to: Date | undefined
}

interface DateRangePickerProps {
 dateRange: DateRange
 onDateRangeChange: (range: DateRange) => void
 className?: string
}

export function DateRangePicker({ 
 dateRange, 
 onDateRangeChange, 
 className 
}: DateRangePickerProps) {
 const [isOpen, setIsOpen] = React.useState(false)

 // กำหนดช่วงเวลาที่อนุญาต (ย้อนหลัง 3 เดือน)
 const threeMonthsAgo = new Date()
 threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
 
 const today = new Date()

 const handlePresetSelect = (preset: string) => {
  const now = new Date()
  let from: Date | undefined
  let to: Date | undefined

  switch (preset) {
   case 'today':
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    break
   case 'yesterday':
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    from = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
    to = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
    break
   case 'thisWeek':
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    from = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    break
   case 'lastWeek':
    const lastWeekStart = new Date(now)
    lastWeekStart.setDate(now.getDate() - now.getDay() - 7)
    const lastWeekEnd = new Date(now)
    lastWeekEnd.setDate(now.getDate() - now.getDay() - 1)
    from = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate())
    to = new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate())
    break
   case 'thisMonth':
    from = new Date(now.getFullYear(), now.getMonth(), 1)
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    break
   case 'lastMonth':
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    from = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
    to = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), lastMonthEnd.getDate())
    break
   case 'last3Months':
    from = new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1)
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    break
   case 'custom':
    // ไม่ทำอะไร ให้ผู้ใช้เลือกเอง
    return
  }

  onDateRangeChange({ from, to })
  setIsOpen(false)
 }

 const formatDateRange = () => {
  if (!dateRange.from) {
   return "เลือกช่วงเวลา"
  }
  
  if (!dateRange.to) {
   return format(dateRange.from, "dd/MM/yyyy", { locale: th })
  }
  
  if (dateRange.from.getTime() === dateRange.to.getTime()) {
   return format(dateRange.from, "dd/MM/yyyy", { locale: th })
  }
  
  return `${format(dateRange.from, "dd/MM/yyyy", { locale: th })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: th })}`
 }

 return (
  <div className={cn("space-y-2", className)}>
   <Popover open={isOpen} onOpenChange={setIsOpen}>
    <PopoverTrigger asChild>
     <Button
      variant="outline"
      className={cn(
       "w-full justify-start text-left font-normal",
       !dateRange.from && "text-muted-foreground"
      )}
     >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {formatDateRange()}
     </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
     <div className="p-3">
      <div className="space-y-2 mb-4">
       <label className="text-sm font-medium">ช่วงเวลาที่กำหนดไว้</label>
       <Select onValueChange={handlePresetSelect}>
        <SelectTrigger>
         <SelectValue placeholder="เลือกช่วงเวลา" />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="today">วันนี้</SelectItem>
         <SelectItem value="yesterday">เมื่อวาน</SelectItem>
         <SelectItem value="thisWeek">สัปดาห์นี้</SelectItem>
         <SelectItem value="lastWeek">สัปดาห์ที่แล้ว</SelectItem>
         <SelectItem value="thisMonth">เดือนนี้</SelectItem>
         <SelectItem value="lastMonth">เดือนที่แล้ว</SelectItem>
         <SelectItem value="last3Months">3 เดือนที่แล้ว</SelectItem>
         <SelectItem value="custom">กำหนดเอง</SelectItem>
        </SelectContent>
       </Select>
      </div>
      <Calendar
       initialFocus
       mode="range"
       defaultMonth={dateRange.from}
       selected={dateRange}
       onSelect={(range) => {
        if (range) {
         onDateRangeChange(range)
        }
       }}
       numberOfMonths={2}
       disabled={(date) => {
        // ปิดการใช้งานวันที่เกิน 3 เดือนที่แล้ว
        return date < threeMonthsAgo || date > today
       }}
       locale={th}
      />
      <div className="flex justify-end space-x-2 pt-2 border-t">
       <Button
        variant="outline"
        size="sm"
        onClick={() => {
         onDateRangeChange({ from: undefined, to: undefined })
         setIsOpen(false)
        }}
       >
        ล้าง
       </Button>
       <Button
        size="sm"
        onClick={() => setIsOpen(false)}
       >
        ตกลง
       </Button>
      </div>
     </div>
    </PopoverContent>
   </Popover>
  </div>
 )
}
