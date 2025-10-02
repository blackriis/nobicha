import { NextRequest, NextResponse } from 'next/server'
import { getRateLimiterForEndpoint } from '@/lib/rate-limit'

// GET /api/rate-limit/status - Get current rate limit status for the client
export async function GET(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    const rateLimiter = getRateLimiterForEndpoint(pathname)
    const status = rateLimiter.getStatus(request)
    
    const now = Date.now()
    const timeUntilReset = Math.max(0, status.resetTime - now)
    const timeUntilResetMinutes = Math.ceil(timeUntilReset / 60000)
    
    return NextResponse.json({
      success: true,
      data: {
        current: {
          count: status.count,
          limit: status.limit,
          remaining: Math.max(0, status.limit - status.count),
          blocked: status.blocked,
          timeUntilReset: timeUntilReset,
          timeUntilResetMinutes: timeUntilResetMinutes,
          resetTime: new Date(status.resetTime).toISOString()
        },
        limits: {
          maxRequests: status.limit,
          windowMs: (rateLimiter as unknown as { windowMs: number; blockDurationMs: number }).windowMs,
          windowMinutes: Math.ceil((rateLimiter as unknown as { windowMs: number; blockDurationMs: number }).windowMs / 60000),
          blockDurationMs: (rateLimiter as unknown as { windowMs: number; blockDurationMs: number }).blockDurationMs,
          blockDurationMinutes: Math.ceil((rateLimiter as unknown as { windowMs: number; blockDurationMs: number }).blockDurationMs / 60000)
        },
        usage: {
          percentage: Math.round((status.count / status.limit) * 100),
          isNearLimit: status.count >= status.limit * 0.8,
          isAtLimit: status.count >= status.limit
        }
      }
    })
  } catch (error) {
    console.error('Rate limit status error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal Server Error',
        message: 'ไม่สามารถตรวจสอบสถานะ rate limit ได้'
      },
      { status: 500 }
    )
  }
}
