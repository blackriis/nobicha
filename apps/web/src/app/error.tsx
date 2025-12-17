'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">เกิดข้อผิดพลาด</h1>
        <p className="text-muted-foreground mb-4">
          {error.message || 'เกิดข้อผิดพลาดบางอย่าง'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          ลองอีกครั้ง
        </button>
      </div>
    </div>
  )
}
