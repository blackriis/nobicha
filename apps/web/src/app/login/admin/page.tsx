'use client'

import { LoginForm } from '@/components/auth'
import { Suspense } from 'react'

export default function AdminLoginPage() {
 return (
  <Suspense fallback={<div>Loading...</div>}>
   <LoginForm
    role="admin"
    title="เข้าสู่ระบบผู้ดูแลระบบ"
    description="สำหรับผู้ดูแลระบบเท่านั้น"
   />
  </Suspense>
 )
}