/**
 * Rate Limiting Service
 * Provides advanced rate limiting management with monitoring and analytics
 */

import { NextRequest } from 'next/server'
import { getRateLimiterForEndpoint, RateLimiter } from '@/lib/rate-limit'
import { retryWithBackoff, isRetryableError } from '@/lib/utils/retry.utils'

export interface RateLimitStatus {
  count: number
  limit: number
  remaining: number
  resetTime: number
  blocked: boolean
  timeUntilReset: number
  usagePercentage: number
  isNearLimit: boolean
  isAtLimit: boolean
}

export interface RateLimitAnalytics {
  totalRequests: number
  blockedRequests: number
  averageRequestsPerMinute: number
  peakRequestsPerMinute: number
  mostFrequentEndpoints: Array<{ endpoint: string; count: number }>
}

export class RateLimitService {
  private analytics: Map<string, number> = new Map()
  private blockedCount: number = 0
  private totalRequests: number = 0

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(request: NextRequest): Promise<{
    allowed: boolean
    status: RateLimitStatus
    resetTime?: number
  }> {
    const { pathname } = request.nextUrl
    const rateLimiter = getRateLimiterForEndpoint(pathname)
    
    // Track analytics
    this.trackRequest(pathname)
    
    const { limited, resetTime } = rateLimiter.isRateLimited(request)
    
    if (limited) {
      this.blockedCount++
    }
    
    const status = this.getRateLimitStatus(request, rateLimiter)
    
    return {
      allowed: !limited,
      status,
      resetTime: limited ? resetTime : undefined
    }
  }

  /**
   * Get detailed rate limit status
   */
  getRateLimitStatus(request: NextRequest, rateLimiter?: RateLimiter): RateLimitStatus {
    const limiter = rateLimiter || getRateLimiterForEndpoint(request.nextUrl.pathname)
    const status = limiter.getStatus(request)
    
    const now = Date.now()
    const timeUntilReset = Math.max(0, status.resetTime - now)
    const remaining = Math.max(0, status.limit - status.count)
    const usagePercentage = Math.round((status.count / status.limit) * 100)
    
    return {
      count: status.count,
      limit: status.limit,
      remaining,
      resetTime: status.resetTime,
      blocked: status.blocked,
      timeUntilReset,
      usagePercentage,
      isNearLimit: status.count >= status.limit * 0.8,
      isAtLimit: status.count >= status.limit
    }
  }

  /**
   * Execute API call with automatic retry on rate limiting
   */
  async executeWithRetry<T>(
    request: NextRequest,
    apiCall: () => Promise<T>,
    retryOptions: {
      maxAttempts?: number
      baseDelayMs?: number
      maxDelayMs?: number
    } = {}
  ): Promise<{
    success: boolean
    data?: T
    error?: Error
    attempts: number
    wasRateLimited: boolean
  }> {
    const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = retryOptions
    
    let wasRateLimited = false
    
    const result = await retryWithBackoff(async () => {
      try {
        return await apiCall()
      } catch (error) {
        if (isRetryableError(error)) {
          wasRateLimited = true
          throw error
        }
        throw error
      }
    }, {
      maxAttempts,
      baseDelayMs,
      maxDelayMs,
      backoffMultiplier: 2,
      jitter: true
    })
    
    return {
      ...result,
      wasRateLimited
    }
  }

  /**
   * Track request for analytics
   */
  private trackRequest(endpoint: string): void {
    this.totalRequests++
    const current = this.analytics.get(endpoint) || 0
    this.analytics.set(endpoint, current + 1)
  }

  /**
   * Get analytics data
   */
  getAnalytics(): RateLimitAnalytics {
    const mostFrequentEndpoints = Array.from(this.analytics.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return {
      totalRequests: this.totalRequests,
      blockedRequests: this.blockedCount,
      averageRequestsPerMinute: this.totalRequests, // Simplified for now
      peakRequestsPerMinute: Math.max(...Array.from(this.analytics.values())),
      mostFrequentEndpoints
    }
  }

  /**
   * Reset analytics (useful for testing)
   */
  resetAnalytics(): void {
    this.analytics.clear()
    this.blockedCount = 0
    this.totalRequests = 0
  }

  /**
   * Get rate limit recommendations based on usage patterns
   */
  getRecommendations(): Array<{
    type: 'increase' | 'decrease' | 'maintain'
    endpoint: string
    currentLimit: number
    recommendedLimit: number
    reason: string
  }> {
    const recommendations: Array<{
      type: 'increase' | 'decrease' | 'maintain'
      endpoint: string
      currentLimit: number
      recommendedLimit: number
      reason: string
    }> = []
    
    for (const [endpoint, count] of this.analytics.entries()) {
      const rateLimiter = getRateLimiterForEndpoint(endpoint)
      const currentLimit = (rateLimiter as unknown as { maxRequests: number }).maxRequests
      
      // Simple recommendation logic
      if (count > currentLimit * 0.9) {
        recommendations.push({
          type: 'increase',
          endpoint,
          currentLimit,
          recommendedLimit: Math.ceil(currentLimit * 1.5),
          reason: 'High usage detected, consider increasing limit'
        })
      } else if (count < currentLimit * 0.1) {
        recommendations.push({
          type: 'decrease',
          endpoint,
          currentLimit,
          recommendedLimit: Math.ceil(currentLimit * 0.7),
          reason: 'Low usage detected, consider decreasing limit'
        })
      } else {
        recommendations.push({
          type: 'maintain',
          endpoint,
          currentLimit,
          recommendedLimit: currentLimit,
          reason: 'Usage is within acceptable range'
        })
      }
    }
    
    return recommendations
  }
}

// Singleton instance
export const rateLimitService = new RateLimitService()
