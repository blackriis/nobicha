import type { Database } from '@employee-management/database'

type UserProfile = Database['public']['Tables']['users']['Row']

interface CacheEntry {
  profile: UserProfile
  timestamp: number
  expiry: number
}

// In-memory cache with TTL (Time To Live)
const userProfileCache = new Map<string, CacheEntry>()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export class UserProfileCache {
  private ttl: number

  constructor(ttl: number = DEFAULT_TTL) {
    this.ttl = ttl
  }

  // Get cached user profile
  get(userId: string): UserProfile | null {
    const entry = userProfileCache.get(userId)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    
    // Check if entry has expired
    if (now > entry.expiry) {
      userProfileCache.delete(userId)
      return null
    }

    return entry.profile
  }

  // Set user profile in cache
  set(userId: string, profile: UserProfile): void {
    const now = Date.now()
    
    userProfileCache.set(userId, {
      profile,
      timestamp: now,
      expiry: now + this.ttl
    })
  }

  // Remove user profile from cache
  delete(userId: string): boolean {
    return userProfileCache.delete(userId)
  }

  // Clear all cached profiles
  clear(): void {
    userProfileCache.clear()
  }

  // Get cache statistics
  getStats(): { size: number, entries: string[] } {
    return {
      size: userProfileCache.size,
      entries: Array.from(userProfileCache.keys())
    }
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now()
    let cleanedCount = 0

    for (const [userId, entry] of userProfileCache.entries()) {
      if (now > entry.expiry) {
        userProfileCache.delete(userId)
        cleanedCount++
      }
    }

    return cleanedCount
  }

  // Update specific fields in cached profile
  updateCached(userId: string, updates: Partial<UserProfile>): boolean {
    const entry = userProfileCache.get(userId)
    
    if (!entry) {
      return false
    }

    const now = Date.now()
    if (now > entry.expiry) {
      userProfileCache.delete(userId)
      return false
    }

    // Update the cached profile
    const updatedProfile = { ...entry.profile, ...updates }
    this.set(userId, updatedProfile)
    return true
  }
}

// Export singleton instance
export const userCache = new UserProfileCache()

// Automatic cleanup every 10 minutes
setInterval(() => {
  const cleaned = userCache.cleanup()
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired user profile cache entries`)
  }
}, 10 * 60 * 1000)