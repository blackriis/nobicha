import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RateLimiter, getRateLimiterForEndpoint, createRateLimitResponse } from '@/lib/rate-limit'

// Mock NextRequest
const createMockRequest = (pathname: string, headers: Record<string, string> = {}) => ({
  nextUrl: { pathname },
  headers: {
    get: (key: string) => headers[key] || null
  }
}) as any

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
      blockDurationMs: 120000 // 2 minutes
    })
  })

  it('should allow requests within limit', () => {
    const request = createMockRequest('/test', { 'x-forwarded-for': '192.168.1.1' })
    
    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.isRateLimited(request)
      expect(result.limited).toBe(false)
    }
  })

  it('should block requests when limit exceeded', () => {
    const request = createMockRequest('/test', { 'x-forwarded-for': '192.168.1.1' })
    
    // Exceed the limit
    for (let i = 0; i < 6; i++) {
      const result = rateLimiter.isRateLimited(request)
      if (i < 5) {
        expect(result.limited).toBe(false)
      } else {
        expect(result.limited).toBe(true)
        expect(result.resetTime).toBeDefined()
      }
    }
  })

  it('should reset counter after window expires', () => {
    const request = createMockRequest('/test', { 'x-forwarded-for': '192.168.1.1' })
    
    // Exceed limit
    for (let i = 0; i < 6; i++) {
      rateLimiter.isRateLimited(request)
    }
    
    // Mock time passing
    vi.useFakeTimers()
    vi.advanceTimersByTime(61000) // Advance 61 seconds
    
    const result = rateLimiter.isRateLimited(request)
    expect(result.limited).toBe(false)
    
    vi.useRealTimers()
  })

  it('should track different clients separately', () => {
    const request1 = createMockRequest('/test', { 'x-forwarded-for': '192.168.1.1' })
    const request2 = createMockRequest('/test', { 'x-forwarded-for': '192.168.1.2' })
    
    // Both clients should be able to make requests independently
    for (let i = 0; i < 5; i++) {
      const result1 = rateLimiter.isRateLimited(request1)
      const result2 = rateLimiter.isRateLimited(request2)
      
      expect(result1.limited).toBe(false)
      expect(result2.limited).toBe(false)
    }
  })

  it('should provide correct status information', () => {
    const request = createMockRequest('/test', { 'x-forwarded-for': '192.168.1.1' })
    
    // Make 3 requests
    for (let i = 0; i < 3; i++) {
      rateLimiter.isRateLimited(request)
    }
    
    const status = rateLimiter.getStatus(request)
    expect(status.count).toBe(3)
    expect(status.limit).toBe(5)
    expect(status.blocked).toBe(false)
    expect(status.resetTime).toBeGreaterThan(Date.now())
  })
})

describe('getRateLimiterForEndpoint', () => {
  it('should return auth rate limiter for login routes', () => {
    const limiter = getRateLimiterForEndpoint('/login/admin')
    expect(limiter).toBeDefined()
  })

  it('should return critical rate limiter for payroll routes', () => {
    const limiter = getRateLimiterForEndpoint('/api/admin/payroll/cycles')
    expect(limiter).toBeDefined()
  })

  it('should return important rate limiter for admin routes', () => {
    const limiter = getRateLimiterForEndpoint('/api/admin/branches')
    expect(limiter).toBeDefined()
  })

  it('should return public rate limiter for location routes', () => {
    const limiter = getRateLimiterForEndpoint('/api/location/nearby-branches')
    expect(limiter).toBeDefined()
  })

  it('should return general rate limiter for unknown routes', () => {
    const limiter = getRateLimiterForEndpoint('/api/unknown')
    expect(limiter).toBeDefined()
  })
})

describe('createRateLimitResponse', () => {
  it('should create proper rate limit response', () => {
    const resetTime = Date.now() + 60000 // 1 minute from now
    const response = createRateLimitResponse(resetTime)
    
    expect(response.status).toBe(429)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('Retry-After')).toBeDefined()
  })

  it('should include Thai error message', async () => {
    const resetTime = Date.now() + 60000
    const response = createRateLimitResponse(resetTime)
    const body = await response.json()
    
    expect(body.error).toBe('Too Many Requests')
    expect(body.message).toContain('การร้องขอเกินขีดจำกัด')
    expect(body.messageEn).toBe('Rate limit exceeded. Please try again later.')
    expect(body.suggestion).toBeDefined()
  })

  it('should calculate retry time correctly', async () => {
    const resetTime = Date.now() + 120000 // 2 minutes from now
    const response = createRateLimitResponse(resetTime)
    const body = await response.json()
    
    expect(body.retryAfter).toBeGreaterThan(0)
    expect(body.retryAfter).toBeLessThanOrEqual(120)
  })
})
