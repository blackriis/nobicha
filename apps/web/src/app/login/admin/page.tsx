'use client'

import { LoginForm } from '@/components/auth'

export default function AdminLoginPage() {
  return (
    <LoginForm
      role="admin"
      title="เข้าสู่ระบบผู้ดูแลระบบ"
      description="สำหรับผู้ดูแลระบบเท่านั้น"
    />
  )
}