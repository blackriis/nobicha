import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@employee-management/database'
import { config as appConfig } from '@employee-management/config'
import { getRateLimiterForEndpoint, createRateLimitResponse } from '@/lib/rate-limit'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Apply rate limiting based on endpoint type
  const rateLimiter = getRateLimiterForEndpoint(pathname)
  const { limited, resetTime } = rateLimiter.isRateLimited(req)
  
  if (limited && resetTime) {
    return createRateLimitResponse(resetTime, rateLimiter)
  }

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add HSTS header (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // Add CSP header
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    // Allow local previews (blob:) and Supabase public URLs
    "img-src 'self' data: blob: https://*.supabase.co",
    // Allow Supabase and websockets
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "font-src 'self'",
    "object-src 'none'",
    // Permit blob: for potential media previews
    "media-src 'self' blob:",
    "frame-src 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspDirectives)

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login/employee', '/login/admin', '/unauthorized', '/api/test-db', '/api/user/profile', '/404']
  const isPublicRoute = publicRoutes.some(route => pathname === route) || pathname.startsWith('/api/') || pathname.startsWith('/_not-found')

  // Skip Supabase operations if using placeholder values
  const isPlaceholderConfig = appConfig.supabase.url.includes('placeholder') || 
                             appConfig.supabase.anonKey.includes('placeholder')
  
  if (isPlaceholderConfig) {
    console.warn('🚧 Supabase not configured - skipping authentication in middleware')
    // If accessing protected routes without real Supabase config, redirect to setup page
    if (!isPublicRoute && !pathname.startsWith('/api/')) {
      const setupUrl = new URL('/login/employee', req.url)
      setupUrl.searchParams.set('error', 'supabase_not_configured')
      return NextResponse.redirect(setupUrl)
    }
    return response
  }

  const supabase = createServerClient<Database>(
    appConfig.supabase.url,
    appConfig.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
      global: {
        // Custom fetch wrapper to handle network errors gracefully in Edge runtime
        fetch: async (url, options = {}) => {
          try {
            // Use native fetch with error handling
            const response = await fetch(url, options)
            return response
          } catch (error) {
            // Handle network errors gracefully
            const errorMessage = error instanceof Error ? error.message : String(error)
            const isNetworkError = 
              errorMessage.includes('fetch failed') ||
              errorMessage.includes('Failed to fetch') ||
              error instanceof TypeError ||
              (error instanceof Error && error.name === 'TypeError')
            
            if (isNetworkError) {
              console.warn('⚠️ Middleware: Network error in Supabase fetch:', {
                url: typeof url === 'string' ? url : 'unknown',
                error: errorMessage,
                pathname,
                timestamp: new Date().toISOString()
              })
              
              // Return an error response that Supabase client will handle gracefully
              // Status 401 will be treated as unauthenticated, which is the desired behavior
              return new Response(
                JSON.stringify({ 
                  error: 'Network error',
                  message: 'Failed to connect to authentication service'
                }),
                {
                  status: 401,
                  statusText: 'Unauthorized',
                  headers: { 'Content-Type': 'application/json' },
                }
              )
            }
            
            // Re-throw non-network errors
            throw error
          }
        },
      },
      auth: {
        // Disable auto refresh in middleware to prevent fetch errors
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
  
  // Get user with comprehensive error handling for network issues
  let user = null
  let authError = null
  
  try {
    const authResult = await supabase.auth.getUser()
    user = authResult.data.user
    authError = authResult.error
  } catch (error) {
    // Handle network errors (fetch failed) gracefully
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Check if it's a network/fetch error
    if (errorMessage.includes('fetch failed') || 
        errorMessage.includes('Failed to fetch') ||
        error instanceof TypeError) {
      console.warn('⚠️ Middleware: Network error during auth check:', {
        pathname,
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
      
      // Treat network errors as unauthenticated to allow fallback behavior
      // This prevents the middleware from crashing and allows the app to continue
      authError = new Error('Network error during authentication')
      authError.name = 'NetworkError'
    } else {
      // Re-throw unexpected errors
      console.error('❌ Middleware: Unexpected auth error:', {
        pathname,
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }
  
  // Skip authentication for API routes - let the API handle auth internally
  if (pathname.startsWith('/api/')) {
    return response
  }
  
  // Protected routes
  const protectedRoutes = {
    employee: ['/dashboard'],
    admin: ['/admin'],
    all: ['/dashboard', '/admin'] // Routes that require any authentication
  }

  // If user is not authenticated and trying to access protected route
  if ((!user || authError) && !isPublicRoute) {
    // Determine appropriate login page based on requested path
    const loginPage = pathname.startsWith('/admin') ? '/login/admin' : '/login/employee'
    const redirectUrl = new URL(loginPage, req.url)
    
    // Preserve the intended path for redirect after login
    redirectUrl.searchParams.set('redirectTo', pathname)
    
    console.log('🔐 Middleware: Redirecting unauthenticated user:', {
      originalPath: pathname,
      redirectUrl: redirectUrl.toString(),
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    })
    
    // Also store in cookie for persistence
    response.cookies.set('redirectTo', pathname, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
    })
    
    console.log('🍪 Middleware: Set redirect cookie:', pathname)
    
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated, get their profile
  if (user) {
    let profile = null
    
    try {
      const profileResult = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      
      profile = profileResult.data
    } catch (error) {
      // Handle network errors when fetching profile
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('fetch failed') || 
          errorMessage.includes('Failed to fetch') ||
          error instanceof TypeError) {
        console.warn('⚠️ Middleware: Network error fetching user profile:', {
          userId: user.id,
          pathname,
          error: errorMessage,
          timestamp: new Date().toISOString()
        })
        // Continue without profile - will fallback to user_metadata
      } else {
        // Log unexpected errors but don't block the request
        console.error('❌ Middleware: Error fetching user profile:', {
          userId: user.id,
          pathname,
          error: errorMessage,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Prefer role from DB; fallback to verified JWT user_metadata role if missing
    let userRole = (profile as { role: 'admin' | 'employee' } | null)?.role
    if (!userRole) {
      const metaRole = (user.user_metadata as Record<string, unknown> | undefined)?.role
      if (metaRole === 'admin' || metaRole === 'employee') {
        userRole = metaRole
      }
    }

    // Check role-based access
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'admin') {
        const redirectUrl = new URL('/unauthorized', req.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    if (pathname.startsWith('/dashboard')) {
      if (userRole !== 'employee' && userRole !== 'admin') {
        const redirectUrl = new URL('/unauthorized', req.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Redirect authenticated users from login pages to their dashboard
    // Only redirect when we can determine role confidently; otherwise, allow access
    if (pathname.startsWith('/login/')) {
      if (userRole === 'admin') {
        const redirectUrl = new URL('/admin', req.url)
        return NextResponse.redirect(redirectUrl)
      }
      if (userRole === 'employee') {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
      }
      // If role is unknown (e.g., profile not created yet), do not redirect
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
