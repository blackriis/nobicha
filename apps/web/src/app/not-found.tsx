import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card rounded-lg p-6 text-center border border-border">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-muted">
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          404 - ไม่พบหน้า
        </h1>
        
        <p className="text-muted-foreground mb-6">
          หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 w-full"
          >
            กลับไปหน้าแรก
          </Link>
          
          <Link 
            href="/login/employee"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground w-full"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  )
}

