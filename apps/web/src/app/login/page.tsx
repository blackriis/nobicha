'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/auth'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { Suspense } from 'react'

function LoginPageContent() {
  const [activeTab, setActiveTab] = useState('employee')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      {/* Theme Toggle Button - Top Right */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-md px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
