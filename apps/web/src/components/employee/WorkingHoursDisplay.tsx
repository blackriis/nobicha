'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeEntryHistory, timeEntryService } from '@/lib/services/time-entry.service'

interface WorkingHoursDisplayProps {
  timeEntries: TimeEntryHistory[]
}

export function WorkingHoursDisplay({ timeEntries }: WorkingHoursDisplayProps) {
  // Calculate total hours
  const totalHours = timeEntries
    .filter(entry => entry.total_hours && entry.total_hours > 0)
    .reduce((sum, entry) => sum + (entry.total_hours || 0), 0)

  // Count completed sessions
  const completedSessions = timeEntries.filter(entry => entry.check_out_time).length
  const activeSessions = timeEntries.filter(entry => !entry.check_out_time).length
  const totalSessions = timeEntries.length

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">สรุปเวลาทำงาน</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">
              {timeEntryService.formatWorkingHours(totalHours)}
            </p>
            <p className="text-sm text-muted-foreground">รวมเวลาทำงาน</p>
          </div>
          
          <div>
            <p className="text-2xl font-bold">
              {totalSessions}
            </p>
            <p className="text-sm text-muted-foreground">จำนวนเข้างาน</p>
          </div>
          
          <div>
            <p className="text-2xl font-bold text-green-600">
              {completedSessions}
            </p>
            <p className="text-sm text-muted-foreground">เสร็จสิ้น</p>
            {activeSessions > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                กำลังทำงาน: {activeSessions}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default WorkingHoursDisplay