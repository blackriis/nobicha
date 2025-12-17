'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/auth'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function LoginPageContent() {
  const [activeTab, setActiveTab] = useState('employee')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative p-4">
      {/* Theme Toggle Button - Top Right */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-11">
            <TabsTrigger value="employee" className="text-sm sm:text-base">
              พนักงาน
            </TabsTrigger>
            <TabsTrigger value="admin" className="text-sm sm:text-base">
              ผู้ดูแลระบบ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employee" className="mt-0">
            <LoginForm
              role="employee"
              title="เข้าสู่ระบบพนักงาน"
              description="สำหรับพนักงานในระบบบริหารจัดการพนักงาน"
            />
          </TabsContent>

          <TabsContent value="admin" className="mt-0">
            <LoginForm
              role="admin"
              title="เข้าสู่ระบบผู้ดูแลระบบ"
              description="สำหรับผู้ดูแลระบบเท่านั้น"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function LoginPageSkeleton() {
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  )
}
