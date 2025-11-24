'use client';

// Force dynamic rendering to prevent prerender errors
export const dynamic = 'force-dynamic';

// Global error component for catching errors in root layout
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold">เกิดข้อผิดพลาด</h1>
            <p className="mt-4 text-xl">
              {error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'}
            </p>
            <div className="mt-6 space-x-4">
              <button
                onClick={reset}
                className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                ลองอีกครั้ง
              </button>
              <a
                href="/"
                className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                กลับหน้าหลัก
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
