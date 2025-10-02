import type { NextRequest } from 'next/server'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum number of requests allowed in the time window
  blockDurationMs?: number // How long to block after limit is exceeded
}

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked?: number // Timestamp when blocking started
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>()

export class RateLimiter {
  private windowMs: number
  private maxRequests: number
  private blockDurationMs: number

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    this.blockDurationMs = options.blockDurationMs || this.windowMs * 2
  }

  // Get client identifier from request
  private getClientId(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'anonymous'
    
    // Development mode: bypass rate limiting for localhost
    if (process.env.NODE_ENV !== 'production' && 
        (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('192.168.'))) {
      return 'localhost-dev'
    }
    
    // Include user agent for better identification
    const userAgent = req.headers.get('user-agent') || ''
    const userAgentHash = userAgent.slice(0, 50) // First 50 chars
    
    return `${ip}:${userAgentHash}`
  }

  // Check if request should be rate limited
  public isRateLimited(req: NextRequest): { limited: boolean; resetTime?: number } {
    const clientId = this.getClientId(req)
    const now = Date.now()
    
    // Development mode: Give localhost very high limits
    if (clientId === 'localhost-dev') {
      const entry = rateLimitStore.get(clientId)
      if (!entry) {
        rateLimitStore.set(clientId, {
          count: 1,
          resetTime: now + this.windowMs
        })
      } else {
        entry.count++
      }
      // Allow 10000 requests for localhost in dev mode (effectively unlimited)
      return entry && entry.count > 10000 ? { limited: true, resetTime: now + 1000 } : { limited: false }
    }
    
    const entry = rateLimitStore.get(clientId)

    // Clean up expired entries periodically
    this.cleanup()

    if (!entry) {
      // First request from this client
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return { limited: false }
    }

    // Check if currently blocked
    if (entry.blocked && now < entry.blocked + this.blockDurationMs) {
      return { 
        limited: true, 
        resetTime: entry.blocked + this.blockDurationMs 
      }
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      // Reset counter for new window
      entry.count = 1
      entry.resetTime = now + this.windowMs
      entry.blocked = undefined
      return { limited: false }
    }

    // Increment counter
    entry.count++

    // Check if limit exceeded
    if (entry.count > this.maxRequests) {
      entry.blocked = now
      return { 
        limited: true, 
        resetTime: now + this.blockDurationMs 
      }
    }

    return { limited: false, resetTime: entry.resetTime }
  }

  // Clean up expired entries to prevent memory leaks
  private cleanup() {
    const now = Date.now()
    const expiredThreshold = now - this.blockDurationMs * 2

    for (const [clientId, entry] of rateLimitStore.entries()) {
      const isExpired = entry.resetTime < expiredThreshold && 
                       (!entry.blocked || entry.blocked < expiredThreshold)
      
      if (isExpired) {
        rateLimitStore.delete(clientId)
      }
    }
  }

  // Check if request should be allowed (wrapper for isRateLimited)
  public checkLimit(req: NextRequest): { allowed: boolean; resetTime?: number } {
    const result = this.isRateLimited(req)
    return {
      allowed: !result.limited,
      resetTime: result.resetTime
    }
  }

  // Get current status for a request
  public getStatus(req: NextRequest): { 
    count: number, 
    limit: number, 
    resetTime: number,
    blocked: boolean 
  } {
    const clientId = this.getClientId(req)
    const entry = rateLimitStore.get(clientId)
    const now = Date.now()

    if (!entry) {
      return {
        count: 0,
        limit: this.maxRequests,
        resetTime: now + this.windowMs,
        blocked: false
      }
    }

    const isBlocked = entry.blocked && now < entry.blocked + this.blockDurationMs

    return {
      count: entry.count,
      limit: this.maxRequests,
      resetTime: isBlocked ? entry.blocked! + this.blockDurationMs : entry.resetTime,
      blocked: isBlocked || false
    }
  }
}

// Pre-configured rate limiters for different endpoint categories
export const authRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15 for development)
  maxRequests: 100, // 100 login attempts per 5 minutes (increased from 10 for development)
  blockDurationMs: 5 * 60 * 1000, // Block for 5 minutes after limit exceeded (reduced from 30)
})

// Critical APIs (payroll, time tracking, sensitive operations)
export const criticalRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: process.env.NODE_ENV === 'development' ? 2000 : 20, // 2000 for dev, 20 for prod
  blockDurationMs: process.env.NODE_ENV === 'development' ? 1000 : 10 * 60 * 1000, // 1 sec for dev, 10 min for prod
})

// Important APIs (admin operations, reports)
export const importantRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: process.env.NODE_ENV === 'development' ? 5000 : 50, // 5000 for dev, 50 for prod
  blockDurationMs: process.env.NODE_ENV === 'development' ? 1000 : 5 * 60 * 1000, // 1 sec for dev, 5 min for prod
})

// General APIs (branches, materials, general operations)
export const generalRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: process.env.NODE_ENV === 'development' ? 10000 : 200, // 10000 for dev, 200 for prod
  blockDurationMs: process.env.NODE_ENV === 'development' ? 1000 : 3 * 60 * 1000, // 1 sec for dev, 3 min for prod
})

// Public APIs (location services, health checks)
export const publicRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 500, // 500 requests per minute
  blockDurationMs: 2 * 60 * 1000, // Block for 2 minutes
})

// Legacy support - keep for backward compatibility
export { generalRateLimiter as defaultRateLimiter }

// Utility function to get appropriate rate limiter based on API endpoint
export function getRateLimiterForEndpoint(pathname: string): RateLimiter {
  // Authentication routes
  if (pathname.startsWith('/login/') || pathname.startsWith('/api/auth')) {
    return authRateLimiter
  }
  
  // Critical APIs - payroll, time tracking, sensitive operations
  if (pathname.includes('/payroll') || 
      pathname.includes('/time-entries') || 
      pathname.includes('/admin/payroll') ||
      pathname.includes('/admin/bonus') ||
      pathname.includes('/admin/deduction')) {
    return criticalRateLimiter
  }
  
  // Important APIs - admin operations, reports
  if (pathname.startsWith('/api/admin/') || 
      pathname.includes('/reports') ||
      pathname.includes('/audit')) {
    return importantRateLimiter
  }
  
  // Public APIs - location services, health checks
  if (pathname.includes('/location') || 
      pathname.includes('/health') ||
      pathname.includes('/status')) {
    return publicRateLimiter
  }
  
  // Default to general rate limiter for other endpoints
  return generalRateLimiter
}

// Utility function to create rate limit response with Thai messages
export function createRateLimitResponse(resetTime: number, rateLimiter?: RateLimiter) {
  const resetDate = new Date(resetTime).toISOString()
  const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000)
  const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60)
  
  // Get rate limiter info for better error message
  const limitInfo = rateLimiter ? {
    maxRequests: (rateLimiter as Record<string, unknown>).maxRequests as number,
    windowMs: (rateLimiter as Record<string, unknown>).windowMs as number
  } : null
  
  const message = retryAfterMinutes > 1 
    ? `การร้องขอเกินขีดจำกัด กรุณาลองใหม่อีกครั้งใน ${retryAfterMinutes} นาที`
    : `การร้องขอเกินขีดจำกัด กรุณาลองใหม่อีกครั้งใน ${retryAfterSeconds} วินาที`
  
  const suggestion = limitInfo 
    ? ` (ขีดจำกัด: ${limitInfo.maxRequests} requests/${Math.ceil(limitInfo.windowMs / 60000)} นาที)`
    : ''
  
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: message + suggestion,
      messageEn: 'Rate limit exceeded. Please try again later.',
      resetTime: resetDate,
      retryAfter: retryAfterSeconds,
      suggestion: 'กรุณาลดความถี่ในการร้องขอ หรือรอสักครู่แล้วลองใหม่'
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Reset': resetDate,
        'X-RateLimit-Remaining': '0',
        'Retry-After': retryAfterSeconds.toString(),
      },
    }
  )
}