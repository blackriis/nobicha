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
import type { TimeEntryDetail } from 'packages/database';

interface TimeEntryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntryId: string;
  employeeId: string;
}

export function TimeEntryDetailModal({
  isOpen,
  onClose,
  timeEntryId,
  employeeId,
}: TimeEntryDetailModalProps) {
  const [timeEntryDetail, setTimeEntryDetail] = useState<TimeEntryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch time entry detail when modal opens
  useEffect(() => {
    if (isOpen && timeEntryId && employeeId) {
      fetchTimeEntryDetail();
    }
  }, [isOpen, timeEntryId, employeeId]);

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

      // Get auth token from session
      const { createClientComponentClient } = await import('@/lib/supabase')
      const supabase = createClientComponentClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        setError('ไม่พบการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/admin/employees/${employeeId}/time-entries/${timeEntryId}/detail`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถดึงรายละเอียดการทำงานได้');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setTimeEntryDetail(result.data);
      } else {
        throw new Error(result.error || 'ไม่พบข้อมูลการทำงาน');
      }
    } catch (err) {
      console.error('Fetch time entry detail error:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>รายละเอียดการมาทำงาน</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {timeEntryDetail && !loading && (
            <>
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">ข้อมูลพื้นฐาน</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">เวลาลง</label>
                    <p className="text-sm">{formatDateTime(timeEntryDetail.checkInTime)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">เวลาออก</label>
                    <p className="text-sm">
                      {timeEntryDetail.checkOutTime ? formatDateTime(timeEntryDetail.checkOutTime) : 'ยังไม่เช็คเอาท์'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ชั่วโมงทำงาน</label>
                    <p className="text-sm">{timeEntryDetail.totalHours} ชั่วโมง</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">เวลาพัก</label>
                    <p className="text-sm">{timeEntryDetail.breakDuration} นาที</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">สาขา</label>
                    <p className="text-sm">{timeEntryDetail.branch?.name || 'ไม่ระบุสาขา'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ที่อยู่สาขา</label>
                    <p className="text-sm">{timeEntryDetail.branch?.address || 'ไม่ระบุที่อยู่'}</p>
                  </div>
                </div>
              </div>

              {/* Selfie Images */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">รูปภาพการเช็คอิน/เช็คเอาท์</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Check-in Selfie */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">รูปเช็คอิน</h4>
                    {timeEntryDetail.checkInSelfieUrl ? (
                      <div className="border rounded-lg p-2">
                        <img
                          src={timeEntryDetail.checkInSelfieUrl}
                          alt="รูปเช็คอิน"
                          className="w-full h-48 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-selfie.jpg';
                            e.currentTarget.alt = 'ไม่สามารถโหลดรูปภาพได้';
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          เวลา: {formatTime(timeEntryDetail.checkInTime)}
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-8 text-center text-gray-500">
                        <p>ไม่มีรูปภาพเช็คอิน</p>
                      </div>
                    )}
                  </div>

                  {/* Check-out Selfie */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">รูปเช็คเอาท์</h4>
                    {timeEntryDetail.checkOutSelfieUrl ? (
                      <div className="border rounded-lg p-2">
                        <img
                          src={timeEntryDetail.checkOutSelfieUrl}
                          alt="รูปเช็คเอาท์"
                          className="w-full h-48 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-selfie.jpg';
                            e.currentTarget.alt = 'ไม่สามารถโหลดรูปภาพได้';
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          เวลา: {timeEntryDetail.checkOutTime ? formatTime(timeEntryDetail.checkOutTime) : 'ยังไม่เช็คเอาท์'}
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-8 text-center text-gray-500">
                        <p>ไม่มีรูปภาพเช็คเอาท์</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">ข้อมูลตำแหน่ง</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">ตำแหน่งเช็คอิน</h4>
                    <p className="text-sm">{timeEntryDetail.checkInLocation?.address || 'ไม่ระบุตำแหน่ง'}</p>
                    {timeEntryDetail.checkInLocation && (
                      <p className="text-xs text-gray-500">
                        {timeEntryDetail.checkInLocation.latitude}, {timeEntryDetail.checkInLocation.longitude}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">ตำแหน่งเช็คเอาท์</h4>
                    <p className="text-sm">
                      {timeEntryDetail.checkOutLocation?.address || 'ยังไม่เช็คเอาท์'}
                    </p>
                    {timeEntryDetail.checkOutLocation && (
                      <p className="text-xs text-gray-500">
                        {timeEntryDetail.checkOutLocation.latitude}, {timeEntryDetail.checkOutLocation.longitude}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {timeEntryDetail.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">หมายเหตุ</h3>
                  <p className="text-sm">{timeEntryDetail.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
