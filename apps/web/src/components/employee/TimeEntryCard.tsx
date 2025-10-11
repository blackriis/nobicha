'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { TimeEntryHistory, timeEntryService } from '@/lib/services/time-entry.service'

interface TimeEntryCardProps {
 timeEntry: TimeEntryHistory
 onViewDetails?: (timeEntryId: string) => void
}

export function TimeEntryCard({ timeEntry, onViewDetails }: TimeEntryCardProps) {
 const workStatus = timeEntryService.getWorkStatus(timeEntry.check_out_time)
 const checkInTime = timeEntryService.formatTimeForDisplay(timeEntry.check_in_time)
 const checkOutTime = timeEntry.check_out_time 
  ? timeEntryService.formatTimeForDisplay(timeEntry.check_out_time)
  : null
 const workingHours = timeEntry.total_hours 
  ? timeEntryService.formatWorkingHours(timeEntry.total_hours)
  : null
 const date = timeEntryService.formatDateForDisplay(timeEntry.check_in_time)

 return (
  <Card className="mb-3">
   <CardContent className="p-4">
    <div className="flex justify-between items-start mb-2">
     <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
       <h3 className="font-medium text-sm">{date}</h3>
       <Badge 
        variant={workStatus === 'กำลังทำงาน' ? 'default' : 'secondary'}
        className="text-xs"
       >
        {workStatus}
       </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{timeEntry.branch.name}</p>
     </div>
     {workingHours && (
      <div className="text-right">
       <p className="text-sm font-medium">{workingHours}</p>
      </div>
     )}
    </div>
    
    <div className="grid grid-cols-2 gap-4 text-sm">
     <div>
      <p className="text-muted-foreground">เวลาเข้างาน</p>
      <p className="font-medium">{checkInTime}</p>
     </div>
     <div>
      <p className="text-muted-foreground">เวลาออกงาน</p>
      <p className="font-medium">
       {checkOutTime || (
        <span className="text-orange-600">กำลังทำงาน</span>
       )}
      </p>
     </div>
    </div>

    {timeEntry.notes && (
     <div className="mt-3 pt-3 border-t">
      <p className="text-xs text-muted-foreground">หมายเหตุ</p>
      <p className="text-sm mt-1">{timeEntry.notes}</p>
     </div>
    )}

    {/* Detail View Button */}
    {onViewDetails && (
     <div className="mt-3 pt-3 border-t">
      <Button
       variant="outline"
       size="sm"
       onClick={() => onViewDetails(timeEntry.id)}
       className="w-full flex items-center justify-center space-x-2 h-8 text-xs"
      >
       <Eye className="h-3 w-3" />
       <span>ดูรายละเอียด</span>
      </Button>
     </div>
    )}
   </CardContent>
  </Card>
 )
}

export default TimeEntryCard