import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ - ผู้ดูแลระบบ | Employee Management System',
  description: 'เข้าสู่ระบบสำหรับผู้ดูแลระบบ',
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}