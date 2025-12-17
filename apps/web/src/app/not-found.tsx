export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-4">ไม่พบหน้าที่คุณต้องการ</p>
        <a href="/" className="text-primary hover:underline">
          กลับไปหน้าหลัก
        </a>
      </div>
    </div>
  )
}
