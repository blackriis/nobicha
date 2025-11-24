'use client';

// Force dynamic rendering to prevent prerender errors
export const dynamic = 'force-dynamic';

// Error components must be Client Components
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">เกิดข้อผิดพลาด</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          {error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'}
        </p>
        <div className="mt-6 space-x-4">
          <button
            onClick={reset}
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            ลองอีกครั้ง
          </button>
          <a
            href="/"
            className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}
