/*
 * ⚠️ COMPONENT DISABLED - Manual Location Input ถูกปิดใช้งาน
 * 
 * เพื่อความปลอดภัย ระบบไม่อนุญาตให้ผู้ใช้กรอกตำแหน่งด้วยตนเอง
 * จำเป็นต้องใช้ GPS จากอุปกรณ์จริงเท่านั้น
 * 
 * หากต้องการเปิดใช้งานคืน ให้ติดต่อผู้ดูแลระบบ
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface ManualLocationInputProps {
  onLocationSubmit: (latitude: number, longitude: number) => void
  onCancel: () => void
  disabled?: boolean
}

export function ManualLocationInput({ 
  onLocationSubmit, 
  onCancel, 
  disabled = false 
}: ManualLocationInputProps) {
  // คอมโพเนนต์นี้ถูกปิดใช้งานเพื่อความปลอดภัย
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          ฟีเจอร์ถูกปิดใช้งาน
        </CardTitle>
        <CardDescription className="text-red-700">
          เพื่อความปลอดภัย ระบบไม่อนุญาตให้กรอกตำแหน่งด้วยตนเอง
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
          <div className="text-sm text-red-800">
            <div className="font-medium mb-2">🚫 การกรอกตำแหน่งด้วยตนเองถูกปิดใช้งาน</div>
            <ul className="list-disc list-inside space-y-1">
              <li>จำเป็นต้องใช้ GPS จากอุปกรณ์จริงเท่านั้น</li>
              <li>เพื่อป้องกันการปลอมแปลงตำแหน่ง</li>
              <li>รับประกันความถูกต้องของข้อมูลการลงเวลา</li>
            </ul>
          </div>
        </div>

        <div className="text-center space-y-3">
          <p className="text-sm text-red-700">
            กรุณาเปิดใช้งาน GPS และอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์
          </p>
          
          <Button
            onClick={onCancel}
            variant="outline"
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            กลับไปหน้าก่อน
          </Button>
        </div>

        <div className="text-xs text-red-600 bg-red-100 p-3 rounded-lg">
          <p className="font-medium mb-1">📍 วิธีแก้ไข:</p>
          <ul className="list-decimal list-inside space-y-1">
            <li>ตรวจสอบให้แน่ใจว่า GPS เปิดอยู่ในอุปกรณ์</li>
            <li>อนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์</li>
            <li>หากยังไม่ได้ ให้รีเฟรชหน้าเว็บและลองใหม่</li>
            <li>ตรวจสอบว่าไม่มีแอปอื่นบล็อก GPS</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}