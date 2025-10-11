'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SelfieRetakeDialogProps {
 error: string;
 onRetry: () => void;
 onRetake: () => void;
 onCancel: () => void;
}

export function SelfieRetakeDialog({ 
 error, 
 onRetry, 
 onRetake, 
 onCancel 
}: SelfieRetakeDialogProps) {
 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
   <Card className="p-6 max-w-md w-full mx-auto">
    <div className="text-center space-y-4">
     <div className="text-red-500 text-4xl">⚠️</div>
     
     <div>
      <h3 className="text-lg font-medium text-red-600 mb-2">
       อัปโหลดไม่สำเร็จ
      </h3>
      <p className="text-gray-600 text-sm">
       {error}
      </p>
     </div>

     <div className="bg-red-50 p-4 rounded-lg border border-red-200">
      <div className="text-sm text-red-800">
       <div className="font-medium mb-2">คุณสามารถ:</div>
       <ul className="text-left list-disc list-inside space-y-1">
        <li>ลองอัปโหลดใหม่อีกครั้ง (รูปเดิม)</li>
        <li>ถ่ายรูปใหม่ (หากรูปไม่ชัด)</li>
        <li>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
       </ul>
      </div>
     </div>

     <div className="flex flex-col gap-3">
      <Button onClick={onRetry} size="lg" className="w-full">
       🔄 ลองอัปโหลดใหม่
      </Button>
      
      <Button 
       variant="outline" 
       onClick={onRetake} 
       className="w-full"
      >
       📷 ถ่ายรูปใหม่
      </Button>
      
      <Button 
       variant="secondary" 
       onClick={onCancel} 
       className="w-full"
       size="sm"
      >
       ยกเลิก
      </Button>
     </div>

     <div className="text-xs text-gray-500">
      หากยังไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ
     </div>
    </div>
   </Card>
  </div>
 );
}