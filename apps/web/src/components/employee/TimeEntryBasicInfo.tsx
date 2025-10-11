'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Calendar } from 'lucide-react';
import { timeEntryService } from '@/lib/services/time-entry.service';
import type { TimeEntryDetail } from 'packages/database';

interface TimeEntryBasicInfoProps {
 timeEntry: TimeEntryDetail;
}

export function TimeEntryBasicInfo({ timeEntry }: TimeEntryBasicInfoProps) {
 const workStatus = timeEntryService.getWorkStatus(timeEntry.check_out_time);
 const checkInTime = timeEntryService.formatTimeForDisplay(timeEntry.check_in_time);
 const checkOutTime = timeEntry.check_out_time 
  ? timeEntryService.formatTimeForDisplay(timeEntry.check_out_time)
  : '--:--';
 const workDate = timeEntryService.formatDateForDisplay(timeEntry.check_in_time);
 
 const totalHoursDisplay = timeEntry.total_hours 
  ? timeEntryService.formatWorkingHours(timeEntry.total_hours)
  : 'ยังไม่เสร็จสิ้น';

 return (
  <Card>
   <CardHeader>
    <CardTitle className="flex items-center space-x-2">
     <Calendar className="h-5 w-5 text-blue-600" />
     <span>ข้อมูลพื้นฐาน</span>
    </CardTitle>
   </CardHeader>
   <CardContent className="space-y-4">
    {/* Work Status Badge */}
    <div className="flex items-center justify-between">
     <span className="text-sm font-medium text-gray-700">สถานะ:</span>
     <Badge 
      variant={workStatus === 'เสร็จสิ้น' ? 'default' : 'secondary'}
      className={
       workStatus === 'เสร็จสิ้น' 
        ? 'bg-green-100 text-green-800 border-green-200' 
        : 'bg-blue-100 text-blue-800 border-blue-200'
      }
     >
      {workStatus}
     </Badge>
    </div>

    {/* Date */}
    <div className="flex items-center justify-between">
     <span className="text-sm font-medium text-gray-700">วันที่:</span>
     <span className="text-sm text-gray-900">{workDate}</span>
    </div>

    {/* Branch */}
    <div className="flex items-center justify-between">
     <span className="text-sm font-medium text-gray-700 flex items-center">
      <MapPin className="h-4 w-4 mr-1" />
      สาขา:
     </span>
     <span className="text-sm text-gray-900 font-medium">
      {timeEntry.branch.name}
     </span>
    </div>

    {/* Time Information */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
     {/* Check-in Time */}
     <div className="text-center">
      <div className="flex items-center justify-center mb-2">
       <Clock className="h-4 w-4 text-green-600 mr-1" />
       <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
        เช็คอิน
       </span>
      </div>
      <div className="text-lg font-semibold text-gray-900">
       {checkInTime}
      </div>
     </div>

     {/* Check-out Time */}
     <div className="text-center">
      <div className="flex items-center justify-center mb-2">
       <Clock className="h-4 w-4 text-red-600 mr-1" />
       <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
        เช็คเอาท์
       </span>
      </div>
      <div className="text-lg font-semibold text-gray-900">
       {checkOutTime}
      </div>
     </div>

     {/* Total Hours */}
     <div className="text-center">
      <div className="flex items-center justify-center mb-2">
       <Clock className="h-4 w-4 text-blue-600 mr-1" />
       <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
        รวมเวลา
       </span>
      </div>
      <div className="text-lg font-semibold text-gray-900">
       {totalHoursDisplay}
      </div>
     </div>
    </div>

    {/* Work Type Indicator */}
    {timeEntry.total_hours && (
     <div className="flex items-center justify-center pt-2">
      <Badge variant="outline" className="text-xs">
       {timeEntryService.getWorkType(timeEntry.total_hours) === 'daily' 
        ? 'คำนวณแบบรายวัน (>12 ชม.)' 
        : 'คำนวณแบบรายชั่วโมง (≤12 ชม.)'}
      </Badge>
     </div>
    )}
   </CardContent>
  </Card>
 );
}