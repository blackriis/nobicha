import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add custom header to skip static optimization for error pages
  const response = NextResponse.next()
  
  // Check if it's an error page request
  if (request.nextUrl.pathname === '/404' || request.nextUrl.pathname === '/_error') {
    response.headers.set('x-middleware-skip-optimization', '1')
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
