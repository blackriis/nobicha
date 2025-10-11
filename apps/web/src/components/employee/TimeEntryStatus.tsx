'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, RefreshCw, AlertCircle, Calendar, Timer, LogIn } from 'lucide-react';
import { timeEntryService, type TimeEntryStatus } from '@/lib/services/time-entry.service';
import { StatusSkeleton } from '@/components/ui/skeleton-loader';
import { StatusLoading } from '@/components/ui/loading-spinner';

// Helper function to get status styles for text and badge
function getStatusStyles(isCheckedIn: boolean) {
 if (isCheckedIn) {
  return {
   textClass: "font-semibold text-black",
   badgeVariant: "default",
   badgeClass: "bg-emerald-500 hover:bg-emerald-600 text-white"
  };
 } else {
  return {
   textClass: "font-semibold text-muted-foreground",
   badgeVariant: "secondary",
   badgeClass: ""
  };
 }
}

interface TimeEntryStatusProps {
 refreshTrigger?: number;
}

export function TimeEntryStatus({ refreshTrigger }: TimeEntryStatusProps) {
 const [status, setStatus] = useState<TimeEntryStatus | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [currentTime, setCurrentTime] = useState<Date>(new Date());

 // Update current time every minute
 useEffect(() => {
  const timer = setInterval(() => {
   setCurrentTime(new Date());
  }, 60000);

  return () => clearInterval(timer);
 }, []);

 // Load status when component mounts or when refresh is triggered
 useEffect(() => {
  loadStatus();
 }, [refreshTrigger]);

 const loadStatus = async () => {
  try {
   setIsLoading(true);
   setError(null);
   const statusData = await timeEntryService.getStatus();
   setStatus(statusData);
  } catch (error) {
   console.error('Error loading status:', error);
   setError(error instanceof Error ? error.message : 'ไม่สามารถโหลดสถานะได้');
  } finally {
   setIsLoading(false);
  }
 };

 const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('th-TH', {
   hour: '2-digit',
   minute: '2-digit',
   day: '2-digit',
   month: 'short',
   year: 'numeric'
  });
 };

 const formatCurrentSession = (checkInTime: string): string => {
  const checkIn = new Date(checkInTime);
  const now = new Date();
  const diffMs = now.getTime() - checkIn.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return timeEntryService.formatWorkingHours(diffHours);
 };

 if (isLoading) {
  return (
   <div className="space-y-3">
    <StatusSkeleton />
    <StatusSkeleton />
   </div>
  );
 }

 if (error) {
  return (
   <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="space-y-3">
     <div className="font-medium">{error}</div>
     <Button
      onClick={loadStatus}
      size="sm"
      variant="outline"
     >
      <RefreshCw className="h-4 w-4 mr-2" />
      ลองใหม่
     </Button>
    </AlertDescription>
   </Alert>
  );
 }

 return (
  <div className="space-y-4">
   {/* Current Status Card */}
   <Card>
    <CardHeader className="pb-3">
     <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-3 text-base">
       <div className="p-2 rounded-full bg-muted text-muted-foreground">
        <Clock className="h-5 w-5" />
       </div>
       <div>
        <div className="flex items-center gap-2">
         {(() => {
          const styles = getStatusStyles(!!status?.isCheckedIn);
          return (
           <>
            <span className={styles.textClass}>
             {status?.isCheckedIn ? 'กำลังทำงาน' : 'ยังไม่ได้ Check-In'}
            </span>
            <Badge
             variant={styles.badgeVariant as any}
             className={styles.badgeClass}
            >
             {status?.isCheckedIn ? 'Active' : 'Inactive'}
            </Badge>
           </>
          );
         })()}
        </div>
        <CardDescription className="text-sm">
         {status?.isCheckedIn ? 'สถานะการทำงานปัจจุบัน' : 'รอการเช็คอิน'}
        </CardDescription>
       </div>
      </CardTitle>
      
      <Button
       onClick={loadStatus}
       size="sm"
       variant="ghost"
       className="text-muted-foreground hover:text-foreground"
      >
       <RefreshCw className="h-4 w-4" />
      </Button>
     </div>
    </CardHeader>
    
    <CardContent className="pt-0">
     {status?.isCheckedIn && status.activeEntry && (
      <div className="space-y-3">
       <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{status.activeEntry.branch.name}</span>
        <Badge variant="outline" className="ml-auto text-muted-foreground border-muted-foreground">
         สาขา
        </Badge>
       </div>
       
       <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex justify-between items-center">
         <span className="text-muted-foreground">เริ่มงาน:</span>
         <Badge variant="secondary">
          {formatTime(status.activeEntry.checkInTime)}
         </Badge>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-muted-foreground">เวลาทำงาน:</span>
         <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white">
          {formatCurrentSession(status.activeEntry.checkInTime)}
         </Badge>
        </div>
       </div>
      </div>
     )}
     
     {!status?.isCheckedIn && (
      <div className="text-sm text-muted-foreground">
       เวลาปัจจุบัน: {currentTime.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
       })}
      </div>
     )}
    </CardContent>
   </Card>

   {/* Today's Summary */}
   {status && (
    <Card>
     <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
       <div className="p-2 rounded-full bg-primary/10 text-primary">
        <Calendar className="h-5 w-5" />
       </div>
       สรุปวันนี้
      </CardTitle>
     </CardHeader>
     
     <CardContent className="pt-0">
      <div className="grid grid-cols-2 gap-4 text-center">
       <div>
        <div className="flex justify-center mb-2">
         <div className="p-2 rounded-full bg-primary/10 text-primary">
          <LogIn className="h-5 w-5" />
         </div>
        </div>
        <p className="text-xl font-semibold text-primary">
         {status.todayStats.totalEntries}
        </p>
        <p className="text-sm text-muted-foreground">ครั้งที่ Check-In</p>
        <Badge variant="outline" className="mt-1 text-primary border-primary">
         ครั้ง
        </Badge>
       </div>
       
       <div>
        <div className="flex justify-center mb-2">
         <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600">
          <Timer className="h-5 w-5" />
         </div>
        </div>
        <p className="text-xl font-semibold text-emerald-600">
         {timeEntryService.formatWorkingHours(status.todayStats.totalHours)}
        </p>
        <p className="text-sm text-muted-foreground">รวมเวลาทำงาน</p>
        <Badge variant="outline" className="mt-1 text-emerald-600 border-emerald-600">
         ชั่วโมง
        </Badge>
       </div>
      </div>

     </CardContent>
    </Card>
   )}
  </div>
 );
}