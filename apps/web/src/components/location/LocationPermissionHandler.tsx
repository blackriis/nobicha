'use client'

interface LocationPermissionHandlerProps {
  onLocationReceived: (position: GeolocationPosition) => void
  onError: (error: string) => void
  children?: React.ReactNode
}

export function LocationPermissionHandler({ 
  onLocationReceived, 
  onError, 
  children 
}: LocationPermissionHandlerProps) {
  // ลบ UI การแจ้งเตือนการเข้าถึงตำแหน่ง - ส่งต่อ children โดยตรง
  return <>{children}</>
}