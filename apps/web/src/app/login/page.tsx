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
    <div className="min-h-screen flex items-center justify-center bg-background relative px-2 py-1 sm:p-4">
      {/* Theme Toggle Button - Top Right */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-[95vw] sm:max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-auto sm:h-11 gap-0 p-[1px] sm:p-[2px]">
            <TabsTrigger
              value="employee"
              className="h-7 sm:h-[calc(100%-1px)] text-xs sm:text-sm px-1 sm:px-3 py-0.5 sm:py-1 whitespace-nowrap leading-tight gap-0 flex-none overflow-hidden"
            >
              พนักงาน
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="h-7 sm:h-[calc(100%-1px)] text-xs sm:text-sm px-1 sm:px-3 py-0.5 sm:py-1 whitespace-nowrap leading-tight gap-0 flex-none overflow-hidden"
            >
              แอดมิน
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
