'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, MapPin, Camera } from 'lucide-react'

interface CheckInErrorDisplayProps {
 error: string
 onRetry: () => void
 onRetryGPS?: () => void
 onRetryCamera?: () => void
}

export function CheckInErrorDisplay({ 
 error, 
 onRetry, 
 onRetryGPS, 
 onRetryCamera 
}: CheckInErrorDisplayProps) {
 const isGPSError = error.includes('GPS') || error.includes('ตำแหน่ง')
 const isCameraError = error.includes('กล้อง')

 return (
  <Alert variant="destructive">
   <AlertCircle className="h-4 w-4" />
   <AlertDescription>
    <div className="font-medium mb-1">เกิดข้อผิดพลาด</div>
    <div className="mb-3">{error}</div>
    
    {/* Recovery Action Buttons */}
    <div className="flex flex-col sm:flex-row gap-2 mb-3">
     <Button 
      variant="outline" 
      size="sm"
      onClick={onRetry}
      className="flex-1"
     >
      ลองใหม่
     </Button>
     
     {isGPSError && onRetryGPS && (
      <Button 
       variant="outline" 
       size="sm"
       onClick={onRetryGPS}
       className="flex-1 border-primary text-primary hover:bg-primary/5"
      >
       <MapPin className="h-4 w-4 mr-1" />
       อนุญาตตำแหน่งใหม่
      </Button>
     )}
     
     {isCameraError && onRetryCamera && (
      <Button 
       variant="outline" 
       size="sm"
       onClick={onRetryCamera}
       className="flex-1 border-green-200 text-green-600 hover:bg-green-50"
      >
       <Camera className="h-4 w-4 mr-1" />
       อนุญาตกล้องใหม่
      </Button>
     )}
    </div>
    
    {/* Help Text */}
    <div className="p-2 bg-background rounded border border-border">
     <div className="text-xs text-muted-foreground">
      💡 <strong>คำแนะนำ:</strong> หากปัญหายังคงเกิดขึ้น ให้ลองรีเฟรชหน้าเว็บ หรือติดต่อผู้ดูแลระบบ
     </div>
    </div>
   </AlertDescription>
  </Alert>
 )
}