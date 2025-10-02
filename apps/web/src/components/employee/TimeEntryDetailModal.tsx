'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { timeEntryService } from '@/lib/services/time-entry.service';
import type { TimeEntryDetail } from 'packages/database';
import { TimeEntryBasicInfo } from './TimeEntryBasicInfo';
import { SelfieGallery } from './SelfieGallery';
import { GPSLocationDisplay } from './GPSLocationDisplay';
import { MaterialUsageList } from './MaterialUsageList';

interface TimeEntryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntryId: string;
}

export function TimeEntryDetailModal({
  isOpen,
  onClose,
  timeEntryId,
}: TimeEntryDetailModalProps) {
  const [timeEntryDetail, setTimeEntryDetail] = useState<TimeEntryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch time entry detail when modal opens
  useEffect(() => {
    if (isOpen && timeEntryId) {
      fetchTimeEntryDetail();
    }
  }, [isOpen, timeEntryId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeEntryDetail(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchTimeEntryDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate UUID format before making request
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(timeEntryId)) {
        setError(`ID รูปแบบไม่ถูกต้อง: ${timeEntryId}. กรุณาใช้ UUID ที่ถูกต้อง`)
        setLoading(false)
        return
      }

      const result = await timeEntryService.getTimeEntryDetail(timeEntryId);
      
      if (result.success && result.data) {
        setTimeEntryDetail(result.data);
      } else {
        setError(result.error || 'ไม่สามารถดึงรายละเอียดการทำงานได้');
      }
    } catch (err) {
      console.error('Failed to fetch time entry detail:', err);
      setError('เกิดข้อผิดพลาดในการดึงรายละเอียดการทำงาน');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchTimeEntryDetail();
  };

  const handleClose = () => {
    onClose();
  };

  // Handle ESC key press
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            รายละเอียดการลงเวลาทำงาน
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">ปิด</span>
          </Button>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="large" />
            <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-4"
              >
                ลองใหม่
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {timeEntryDetail && !loading && !error && (
          <div className="space-y-6">
            {/* Basic Information */}
            <TimeEntryBasicInfo timeEntry={timeEntryDetail} />

            {/* Selfie Gallery */}
            <SelfieGallery
              checkInSelfieUrl={timeEntryDetail.check_in_selfie_url}
              checkOutSelfieUrl={timeEntryDetail.check_out_selfie_url}
              branchName={timeEntryDetail.branch.name}
            />

            {/* GPS Location Display */}
            {(timeEntryDetail.check_in_location || (timeEntryDetail.branch?.latitude && timeEntryDetail.branch?.longitude)) ? (
              <GPSLocationDisplay
                checkInLocation={
                  timeEntryDetail.check_in_location ?? {
                    latitude: timeEntryDetail.branch.latitude,
                    longitude: timeEntryDetail.branch.longitude,
                  }
                }
                branchLocation={{
                  latitude: timeEntryDetail.branch.latitude,
                  longitude: timeEntryDetail.branch.longitude,
                }}
                branchName={timeEntryDetail.branch.name}
              />
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 text-gray-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium">ไม่มีข้อมูล GPS</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ไม่มีข้อมูลตำแหน่ง GPS สำหรับการเช็คอินครั้งนี้
                </p>
              </div>
            )}

            {/* Material Usage List */}
            <MaterialUsageList materialUsage={timeEntryDetail.material_usage} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}