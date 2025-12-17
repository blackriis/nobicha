'use client'

import { LoginForm } from '@/components/auth'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function AdminLoginSkeleton() {
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

function AdminLoginContent() {
 return (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
   <div className="w-full max-w-md">
    <LoginForm
     role="admin"
     title="เข้าสู่ระบบผู้ดูแลระบบ"
     description="สำหรับผู้ดูแลระบบเท่านั้น"
    />
   </div>
  </div>
 )
}

export default function AdminLoginPage() {
 return (
  <Suspense fallback={<AdminLoginSkeleton />}>
   <AdminLoginContent />
  </Suspense>
 )
}