/**
 * Retry utility with exponential backoff for handling rate limiting and temporary failures
 */

export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  jitter?: boolean
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDelayMs: number
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    jitter = true
  } = options

  let lastError: Error | undefined
  let totalDelayMs = 0

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn()
      return {
        success: true,
        data: result,
        attempts: attempt,
        totalDelayMs
      }
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break
      }

      // Calculate delay with exponential backoff
      const baseDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1)
      const delay = Math.min(baseDelay, maxDelayMs)
      
      // Add jitter to prevent thundering herd
      const jitterAmount = jitter ? Math.random() * 0.1 * delay : 0
      const finalDelay = delay + jitterAmount
      
      totalDelayMs += finalDelay
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay))
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
    totalDelayMs
  }
}

/**
 * Check if an error is retryable (rate limit, network error, etc.)
 */
export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  
  const err = error as Record<string, unknown>
  
  // Rate limiting errors
  if (err.status === 429 || err.statusCode === 429) {
    return true
  }
  
  // Network errors
  if (err.code === 'NETWORK_ERROR' || err.name === 'NetworkError') {
    return true
  }
  
  // Timeout errors
  if (err.code === 'TIMEOUT' || err.name === 'TimeoutError') {
    return true
  }
  
  // Server errors (5xx)
  if (typeof err.status === 'number' && err.status >= 500 && err.status < 600) {
    return true
  }
  
  // Connection errors
  if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
    return true
  }
  
  return false
}

/**
 * Create a retryable API call wrapper
 */
export function createRetryableApiCall<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
) {
  return async (): Promise<RetryResult<T>> => {
    return retryWithBackoff(async () => {
      try {
        return await apiCall()
      } catch (error) {
        // Only retry if it's a retryable error
        if (isRetryableError(error)) {
          throw error
        }
        // For non-retryable errors, return the result directly
        throw new Error(`Non-retryable error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }, options)
  }
}

/**
 * Delay utility for manual retry delays
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 10000,
  backoffMultiplier: number = 2,
  jitter: boolean = true
): number {
  const baseDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1)
  const delay = Math.min(baseDelay, maxDelayMs)
  
  if (jitter) {
    const jitterAmount = Math.random() * 0.1 * delay
    return delay + jitterAmount
  }
  
  return delay
}
