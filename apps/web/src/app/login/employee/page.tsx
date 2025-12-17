'use client'

import { LoginForm } from '@/components/auth'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle } from 'lucide-react'

function EmployeeLoginContent() {
 const searchParams = useSearchParams()
 const error = searchParams.get('error')

 if (error === 'supabase_not_configured') {
  return (
   <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <Card className="max-w-md w-full">
     <CardContent className="pt-6">
      <Alert variant="warning" className="mb-4">
       <AlertTriangle className="h-5 w-5" />
       <AlertTitle className="text-lg">ระบบยังไม่ได้ตั้งค่า</AlertTitle>
       <AlertDescription>
        กรุณาตั้งค่า Environment Variables สำหรับ Supabase ใน .env.local ก่อนใช้งาน
       </AlertDescription>
      </Alert>

      <div className="bg-muted p-4 rounded-md text-sm">
       <p className="font-medium mb-2">ขั้นตอนการตั้งค่า:</p>
       <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
        <li>เข้าไปที่ Supabase Dashboard</li>
        <li>คัดลอก URL และ API Keys</li>
        <li>อัปเดตไฟล์ .env.local</li>
        <li>Restart development server</li>
       </ol>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
       ดูเพิ่มเติมในไฟล์ SETUP_DATABASE_CONNECTION.md
      </p>
     </CardContent>
    </Card>
   </div>
  )
 }

 return (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
   <div className="w-full max-w-md">
    <LoginForm
     role="employee"
     title="เข้าสู่ระบบ"
     description="สำหรับพนักงานในระบบบริหารจัดการพนักงาน"
    />
   </div>
  </div>
 )
}

function EmployeeLoginSkeleton() {
 return (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
   <div className="w-full max-w-md">
    <Card>
     <CardHeader className="space-y-2">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-2/3 mx-auto" />
     </CardHeader>
     <CardContent className="space-y-4">
      <div className="space-y-2">
       <Skeleton className="h-4 w-32" />
       <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
       <Skeleton className="h-4 w-24" />
       <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
     </CardContent>
    </Card>
   </div>
  </div>
 )
}

export default function EmployeeLoginPage() {
 return (
  <Suspense fallback={<EmployeeLoginSkeleton />}>
   <EmployeeLoginContent />
  </Suspense>
 )
}