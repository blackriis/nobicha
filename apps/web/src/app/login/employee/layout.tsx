import type { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'เข้าสู่ระบบ - พนักงาน | Employee Management System',
 description: 'เข้าสู่ระบบสำหรับพนักงาน',
}

export default function EmployeeLoginLayout({
 children,
}: {
 children: React.ReactNode
}) {
 return <>{children}</>
}