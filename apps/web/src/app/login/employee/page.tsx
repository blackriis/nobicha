'use client'

import { LoginForm } from '@/components/auth'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function EmployeeLoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (error === 'supabase_not_configured') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-card rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              ระบบยังไม่ได้ตั้งค่า
            </h2>
            <p className="text-muted-foreground mb-6">
              กรุณาตั้งค่า Environment Variables สำหรับ Supabase ใน .env.local ก่อนใช้งาน
            </p>
            <div className="text-left bg-muted p-4 rounded-md text-sm">
              <p className="font-medium mb-2">ขั้นตอนการตั้งค่า:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>เข้าไปที่ Supabase Dashboard</li>
                <li>คัดลอก URL และ API Keys</li>
                <li>อัปเดตไฟล์ .env.local</li>
                <li>Restart development server</li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              ดูเพิ่มเติมในไฟล์ SETUP_DATABASE_CONNECTION.md
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <LoginForm
      role="employee"
      title="เข้าสู่ระบบ"
      description="สำหรับพนักงานในระบบบริหารจัดการพนักงาน"
    />
  )
}

export default function EmployeeLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeeLoginContent />
    </Suspense>
  )
}