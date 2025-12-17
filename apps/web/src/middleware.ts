import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Enhanced CORS headers สำหรับ API routes (Next.js 15.5.2 + Turbopack compatibility)
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Restrict CORS to specific origins in production
    const origin = request.headers.get('origin')
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://vercel.app',
      // Add your production domain here
    ]

    if (process.env.NODE_ENV === 'production' && origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (process.env.NODE_ENV !== 'production') {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
  }

  // Secure cookies for authentication routes
  if (request.nextUrl.pathname.startsWith('/auth') ||
      request.nextUrl.pathname.startsWith('/api/auth')) {
    const session = request.cookies.get('sb-access-token')

    // Mark cookies as secure and httpOnly in production
    if (session && process.env.NODE_ENV === 'production') {
      response.cookies.set({
        name: 'sb-access-token',
        value: session.value,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }
  }

  // Check if it's an error page request
  if (request.nextUrl.pathname === '/404' || request.nextUrl.pathname === '/_error') {
    response.headers.set('x-middleware-skip-optimization', '1')
  }

  // Content Security Policy headers for better security
  if (!request.nextUrl.pathname.startsWith('/api')) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data: https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.supabase.co https://nyhwnafkybuxneqiaffq.supabase.co",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')

    response.headers.set('Content-Security-Policy', csp)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
