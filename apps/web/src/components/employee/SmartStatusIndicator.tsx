'use client'

import React from 'react'
import { Clock, CheckCircle2, AlertCircle, Coffee } from 'lucide-react'

interface SmartStatusIndicatorProps {
 isCheckedIn: boolean
 currentSessionHours?: number
 branchName?: string
 className?: string
}

export function SmartStatusIndicator({ 
 isCheckedIn, 
 currentSessionHours = 0, 
 branchName,
 className = '' 
}: SmartStatusIndicatorProps) {
 // การคำนวณสถานะและ UI elements
 const getStatusColor = () => {
  if (!isCheckedIn) return 'gray'
  if (currentSessionHours < 4) return 'green'
  if (currentSessionHours < 8) return 'blue'
  if (currentSessionHours < 12) return 'yellow'
  return 'orange'
 }

 const getStatusMessage = () => {
  if (!isCheckedIn) {
   return {
    title: 'ยังไม่ได้เริ่มงาน',
    subtitle: '',
    icon: Clock,
    pulse: false
   }
  }

  const hours = Math.floor(currentSessionHours)
  const minutes = Math.floor((currentSessionHours - hours) * 60)
  const timeText = hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')} ชม.` : `${minutes} นาที`

  if (currentSessionHours < 1) {
   return {
    title: 'เพิ่งเริ่มงาน',
    subtitle: `${timeText}`,
    icon: CheckCircle2,
    pulse: true
   }
  } else if (currentSessionHours < 4) {
   return {
    title: 'กำลังทำงาน',
    subtitle: `${timeText}`,
    icon: CheckCircle2,
    pulse: true
   }
  } else if (currentSessionHours >= 8) {
   return {
    title: 'ทำงานครบแล้ว',
    subtitle: `${timeText}`,
    icon: Coffee,
    pulse: false
   }
  } else {
   return {
    title: 'ทำงานอยู่',
    subtitle: `${timeText}`,
    icon: CheckCircle2,
    pulse: true
   }
  }
 }

 const status = getStatusMessage()
 const colorClass = getStatusColor()
 const StatusIcon = status.icon

 return (
  <div className={`text-center space-y-2 ${className}`}>
   {/* Status Icon with Pulse Animation */}
   <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${
    status.pulse ? 'animate-pulse' : ''
   } ${
    colorClass === 'gray' ? 'bg-gray-100' :
    colorClass === 'green' ? 'bg-green-100' :
    colorClass === 'blue' ? 'bg-blue-100' :
    colorClass === 'yellow' ? 'bg-yellow-100' :
    'bg-orange-100'
   }`}>
    <StatusIcon className={`h-8 w-8 ${
     colorClass === 'gray' ? 'text-gray-400' :
     colorClass === 'green' ? 'text-green-600' :
     colorClass === 'blue' ? 'text-blue-600' :
     colorClass === 'yellow' ? 'text-yellow-600' :
     'text-orange-600'
    }`} />
   </div>

   {/* Status Text */}
   <div>
    <h3 className={`text-lg font-semibold mb-1 ${
     isCheckedIn ? 'text-green-700' : 'text-gray-600'
    }`}>
     {status.title}
    </h3>
    <p className="text-sm text-gray-600">
     {status.subtitle}
    </p>
   </div>

   {/* Working Hours Warning for Long Sessions */}
   {currentSessionHours >= 12 && (
    <div className="mt-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
     <div className="flex items-center justify-center space-x-2">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <span className="text-xs text-orange-800 font-medium">
       ทำงานนานแล้ว แนะนำให้พักหรือเช็คเอาท์
      </span>
     </div>
    </div>
   )}
  </div>
 )
}