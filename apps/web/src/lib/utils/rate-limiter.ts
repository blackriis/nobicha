/**
 * Rate limiting utility for login attempts and other sensitive operations
 * Uses memory-based storage for client-side rate limiting
 * For production, consider using Redis or server-side rate limiting
 */

interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  lastAttempt: number
  isLocked?: boolean
  lockUntil?: number
}

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number // Time window in milliseconds
  lockoutMs: number // Lockout duration after max attempts
}

interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetTime?: number
  retryAfter?: number
  message?: string
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout

  constructor(config: RateLimitConfig) {
    this.config = config
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Check if an action is allowed for the given identifier
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now()
    const entry = this.storage.get(identifier)

    // If no entry exists, allow the action
    if (!entry) {
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - 1,
        resetTime: now + this.config.windowMs
      }
    }

    // Check if currently locked out
    if (entry.isLocked && entry.lockUntil && entry.lockUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfter: entry.lockUntil - now,
        message: `Account temporarily locked. Try again in ${Math.ceil((entry.lockUntil - now) / 60000)} minutes.`
      }
    }

    // Check if the window has expired
    const timeSinceFirstAttempt = now - entry.firstAttempt
    if (timeSinceFirstAttempt > this.config.windowMs) {
      // Reset the window
      entry.attempts = 1
      entry.firstAttempt = now
      entry.lastAttempt = now
      entry.isLocked = false
      entry.lockUntil = undefined

      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - 1,
        resetTime: now + this.config.windowMs
      }
    }

    // Check if max attempts reached
    if (entry.attempts >= this.config.maxAttempts) {
      // Lock the account
      entry.isLocked = true
      entry.lockUntil = now + this.config.lockoutMs

      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfter: this.config.lockoutMs,
        message: `Too many failed attempts. Account locked for ${Math.ceil(this.config.lockoutMs / 60000)} minutes.`
      }
    }

    // Allow the action
    entry.attempts += 1
    entry.lastAttempt = now

    return {
      allowed: true,
      remainingAttempts: this.config.maxAttempts - entry.attempts,
      resetTime: entry.firstAttempt + this.config.windowMs
    }
  }

  /**
   * Reset the rate limit for a given identifier
   */
  reset(identifier: string): void {
    this.storage.delete(identifier)
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): RateLimitResult | null {
    const entry = this.storage.get(identifier)
    if (!entry) return null

    const now = Date.now()
    const timeSinceFirstAttempt = now - entry.firstAttempt

    // If window expired, treat as no entry
    if (timeSinceFirstAttempt > this.config.windowMs && !entry.isLocked) {
      return null
    }

    // If locked out
    if (entry.isLocked && entry.lockUntil && entry.lockUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfter: entry.lockUntil - now,
        message: `Account locked. Try again in ${Math.ceil((entry.lockUntil - now) / 60000)} minutes.`
      }
    }

    return {
      allowed: entry.attempts < this.config.maxAttempts,
      remainingAttempts: Math.max(0, this.config.maxAttempts - entry.attempts),
      resetTime: entry.firstAttempt + this.config.windowMs
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()

    for (const [key, entry] of this.storage.entries()) {
      const timeSinceLastAttempt = now - entry.lastAttempt

      // Remove entries that are older than 3x the window and not locked
      if (timeSinceLastAttempt > this.config.windowMs * 3 && !entry.isLocked) {
        this.storage.delete(key)
      }

      // Remove expired locks
      if (entry.isLocked && entry.lockUntil && entry.lockUntil < now) {
        this.storage.delete(key)
      }
    }
  }

  /**
   * Destroy the rate limiter and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.storage.clear()
  }
}

// Export configured instances for different use cases
export const loginRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 30 * 60 * 1000 // 30 minutes
})

export const passwordResetRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  lockoutMs: 60 * 60 * 1000 // 1 hour
})

export default RateLimiter