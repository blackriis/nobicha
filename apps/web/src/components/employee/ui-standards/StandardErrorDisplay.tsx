'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface StandardErrorDisplayProps {
 error: string
 onRetry?: () => void
 actionLabel?: string
 actionType?: 'retry' | 'permission' | 'refresh' | 'navigate'
 showIcon?: boolean
}

export function StandardErrorDisplay({ 
 error, 
 onRetry, 
 actionLabel = 'ลองใหม่',
 actionType = 'retry',
 showIcon = true 
}: StandardErrorDisplayProps) {
 return (
  <Alert variant="destructive">
   {showIcon && <AlertTriangle className="h-4 w-4" />}
   <AlertDescription>
    <div className="font-medium mb-1">เกิดข้อผิดพลาด</div>
    <div className="text-sm mb-3">{error}</div>
    {onRetry && (
     <Button 
      variant="outline" 
      size="sm" 
      onClick={onRetry}
      className="mt-2"
     >
      {actionLabel}
     </Button>
    )}
   </AlertDescription>
  </Alert>
 )
}