import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ไม่ได้รับอนุญาต | Employee Management System',
  description: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          ไม่ได้รับอนุญาต
        </h1>
        
        <p className="text-gray-600 mb-6">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาตรวจสอบสิทธิ์การใช้งานของคุณ
        </p>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/login/employee">
              เข้าสู่ระบบพนักงาน
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/login/admin">
              เข้าสู่ระบบผู้ดูแลระบบ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}