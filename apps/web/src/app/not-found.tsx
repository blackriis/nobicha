import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - ไม่พบหน้า',
  description: 'หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-md w-full rounded-lg p-8 text-center border" style={{ backgroundColor: 'white', borderColor: '#e5e7eb' }}>
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full" style={{ backgroundColor: '#f3f4f6' }}>
            <span className="text-4xl">😕</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-3" style={{ color: '#111827' }}>
          404 - ไม่พบหน้า
        </h1>
        
        <p className="mb-8" style={{ color: '#6b7280' }}>
          หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium w-full"
            style={{ backgroundColor: '#3b82f6', color: 'white' }}
          >
            กลับไปหน้าแรก
          </Link>
          
          <Link 
            href="/login/employee"
            className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium w-full"
            style={{ borderColor: '#d1d5db', backgroundColor: 'white', color: '#374151' }}
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  )
}

