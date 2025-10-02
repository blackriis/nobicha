'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { DateRangeFilter, timeEntryService } from '@/lib/services/time-entry.service'

interface EmptyStateMessageProps {
  dateRange: DateRangeFilter
}

export function EmptyStateMessage({ dateRange }: EmptyStateMessageProps) {
  const rangeLabel = timeEntryService.getDateRangeLabel(dateRange)

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <Clock className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          ไม่มีประวัติการทำงาน
        </h3>
        <p className="text-muted-foreground">
          ไม่พบประวัติการ check-in/check-out ในช่วง{rangeLabel}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          กรุณาเลือกช่วงเวลาอื่น หรือทำการ check-in เพื่อเริ่มบันทึกเวลาทำงาน
        </p>
      </CardContent>
    </Card>
  )
}

export default EmptyStateMessage