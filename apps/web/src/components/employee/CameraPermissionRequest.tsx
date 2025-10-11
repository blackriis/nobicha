'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';

interface CameraPermissionRequestProps {
 onRetry: () => void;
 onCancel: () => void;
}

export function CameraPermissionRequest({ onRetry, onCancel }: CameraPermissionRequestProps) {
 return (
  <Card className="p-6 max-w-md mx-auto">
   <div className="text-center space-y-4">
    <div className="flex justify-center">
     <div className="p-4 bg-blue-50 rounded-full">
      <Camera className="h-12 w-12 text-blue-600" />
     </div>
    </div>
    
    <div>
     <h3 className="text-lg font-medium mb-2">
      ขออนุญาตเข้าถึงกล้อง
     </h3>
     <p className="text-gray-600 text-sm">
      แอปพลิเคชันต้องการเข้าถึงกล้องเพื่อถ่ายรูปเซลฟี่สำหรับการยืนยันตัวตน
     </p>
    </div>

    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
     <div className="text-sm text-amber-800">
      <div className="font-medium mb-2 flex items-center gap-2">
       <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
       ขั้นตอนการอนุญาตการเข้าถึงกล้อง:
      </div>
      <ol className="text-left list-decimal list-inside space-y-1">
       <li><strong>กดปุ่ม "เริ่มใช้กล้อง"</strong> ด้านล่าง</li>
       <li><strong>เมื่อเบราว์เซอร์ถาม ให้กด "Allow" หรือ "อนุญาต"</strong></li>
       <li>หากปฏิเสธไปแล้ว ให้รีเฟรชหน้าและลองใหม่</li>
      </ol>
      <div className="mt-2 p-2 bg-amber-100 rounded text-xs">
       💡 <strong>หมายเหตุ:</strong> การขออนุญาตจะเกิดขึ้น<strong>หลังจาก</strong>กดปุ่มเท่านั้น
      </div>
     </div>
    </div>

    <div className="flex gap-3 justify-center">
     <Button onClick={onRetry} size="lg" className="px-6 bg-green-600 hover:bg-green-700">
      <Camera className="h-4 w-4 mr-2" />
      เริ่มใช้กล้อง
     </Button>
     <Button variant="outline" onClick={onCancel}>
      <X className="h-4 w-4 mr-2" />
      ยกเลิก
     </Button>
    </div>

    <div className="text-xs text-gray-500">
     การถ่ายรูปเซลฟี่เป็นส่วนหนึ่งของระบบรักษาความปลอดภัย<br />
     รูปภาพจะถูกเก็บอย่างปลอดภัยและใช้เฉพาะการยืนยันตัวตน
    </div>
   </div>
  </Card>
 );
}