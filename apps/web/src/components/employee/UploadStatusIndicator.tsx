'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

interface UploadStatusIndicatorProps {
  progress: number;
  retryCount: number;
  action: 'checkin' | 'checkout';
}

export function UploadStatusIndicator({ 
  progress, 
  retryCount, 
  action 
}: UploadStatusIndicatorProps) {
  const actionText = action === 'checkin' ? 'เช็คอิน' : 'เช็คเอาท์';
  
  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="text-center space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">
            กำลังอัปโหลดรูปเซลฟี่
          </h3>
          <p className="text-gray-600 text-sm">
            กรุณารอสักครู่... กำลังบันทึกรูปภาพสำหรับ{actionText}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="space-y-3">
          <div className="relative">
            {/* Animated spinner */}
            <div className="w-16 h-16 mx-auto">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div 
                  className="absolute inset-0 border-4 border-blue-500 rounded-full transition-all duration-300 ease-out"
                  style={{
                    borderTopColor: 'transparent',
                    borderRightColor: progress > 25 ? 'rgb(59 130 246)' : 'transparent',
                    borderBottomColor: progress > 50 ? 'rgb(59 130 246)' : 'transparent',
                    borderLeftColor: progress > 75 ? 'rgb(59 130 246)' : 'transparent',
                    transform: 'rotate(0deg)',
                    animation: 'spin 1s linear infinite'
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Progress text */}
          <div className="text-sm text-gray-500">
            {progress === 0 && "กำลังเตรียมอัปโหลด..."}
            {progress > 0 && progress < 30 && "กำลังประมวลผลรูปภาพ..."}
            {progress >= 30 && progress < 70 && "กำลังอัปโหลดไปยังเซิร์ฟเวอร์..."}
            {progress >= 70 && progress < 100 && "เกือบเสร็จแล้ว..."}
            {progress === 100 && "อัปโหลดเสร็จสิ้น!"}
          </div>
        </div>

        {/* Retry indicator */}
        {retryCount > 1 && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-800">
              <div className="font-medium">กำลังลองใหม่ครั้งที่ {retryCount}</div>
              <div className="text-xs mt-1">
                หากเครือข่ายไม่เสถียร ระบบจะลองอัปโหลดใหม่อัตโนมัติ
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500">
          💡 กรุณาอย่าปิดหน้าต่างนี้จนกว่าจะอัปโหลดเสร็จ
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Card>
  );
}