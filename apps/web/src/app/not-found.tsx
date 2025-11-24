// Force dynamic rendering for 404 page to prevent prerender errors
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          ไม่พบหน้าที่คุณต้องการ
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          กลับหน้าหลัก
        </a>
      </div>
    </div>
  );
}

