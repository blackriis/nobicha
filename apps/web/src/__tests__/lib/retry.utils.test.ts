import { describe, it, expect, vi } from 'vitest'
import { 
  retryWithBackoff, 
  isRetryableError, 
  createRetryableApiCall,
  calculateRetryDelay 
} from '@/lib/utils/retry.utils'

describe('retryWithBackoff', () => {
  it('should succeed on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    
    const result = await retryWithBackoff(mockFn, {
      maxAttempts: 3,
      baseDelayMs: 100
    })
    
    expect(result.success).toBe(true)
    expect(result.data).toBe('success')
    expect(result.attempts).toBe(1)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success')
    
    const result = await retryWithBackoff(mockFn, {
      maxAttempts: 3,
      baseDelayMs: 10 // Small delay for testing
    })
    
    expect(result.success).toBe(true)
    expect(result.data).toBe('success')
    expect(result.attempts).toBe(3)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should fail after max attempts', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Persistent error'))
    
    const result = await retryWithBackoff(mockFn, {
      maxAttempts: 2,
      baseDelayMs: 10
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.attempts).toBe(2)
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('should respect max delay', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))
    
    const startTime = Date.now()
    const result = await retryWithBackoff(mockFn, {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 2000
    })
    const endTime = Date.now()
    
    expect(result.success).toBe(false)
    expect(endTime - startTime).toBeLessThan(5000) // Should not exceed max delay
  })

  it('should include jitter in delays', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))
    
    const result1 = await retryWithBackoff(mockFn, {
      maxAttempts: 2,
      baseDelayMs: 100,
      jitter: true
    })
    
    const result2 = await retryWithBackoff(mockFn, {
      maxAttempts: 2,
      baseDelayMs: 100,
      jitter: true
    })
    
    // Results should be different due to jitter
    expect(result1.totalDelayMs).not.toBe(result2.totalDelayMs)
  })
})

describe('isRetryableError', () => {
  it('should identify rate limiting errors as retryable', () => {
    const rateLimitError = { status: 429 }
    expect(isRetryableError(rateLimitError)).toBe(true)
  })

  it('should identify network errors as retryable', () => {
    const networkError = { code: 'NETWORK_ERROR' }
    expect(isRetryableError(networkError)).toBe(true)
  })

  it('should identify timeout errors as retryable', () => {
    const timeoutError = { code: 'TIMEOUT' }
    expect(isRetryableError(timeoutError)).toBe(true)
  })

  it('should identify server errors as retryable', () => {
    const serverError = { status: 500 }
    expect(isRetryableError(serverError)).toBe(true)
  })

  it('should identify connection errors as retryable', () => {
    const connError = { code: 'ECONNRESET' }
    expect(isRetryableError(connError)).toBe(true)
  })

  it('should not identify client errors as retryable', () => {
    const clientError = { status: 400 }
    expect(isRetryableError(clientError)).toBe(false)
  })

  it('should not identify authentication errors as retryable', () => {
    const authError = { status: 401 }
    expect(isRetryableError(authError)).toBe(false)
  })

  it('should handle null/undefined errors', () => {
    expect(isRetryableError(null)).toBe(false)
    expect(isRetryableError(undefined)).toBe(false)
  })
})

describe('createRetryableApiCall', () => {
  it('should create a retryable wrapper', async () => {
    const mockApiCall = vi.fn().mockResolvedValue('data')
    const retryableCall = createRetryableApiCall(mockApiCall, {
      maxAttempts: 2,
      baseDelayMs: 10
    })
    
    const result = await retryableCall()
    
    expect(result.success).toBe(true)
    expect(result.data).toBe('data')
    expect(mockApiCall).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable errors', async () => {
    const mockApiCall = vi.fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValue('data')
    
    const retryableCall = createRetryableApiCall(mockApiCall, {
      maxAttempts: 2,
      baseDelayMs: 10
    })
    
    const result = await retryableCall()
    
    expect(result.success).toBe(true)
    expect(result.data).toBe('data')
    expect(mockApiCall).toHaveBeenCalledTimes(2)
  })

  it('should not retry on non-retryable errors', async () => {
    const mockApiCall = vi.fn().mockRejectedValue({ status: 400 })
    
    const retryableCall = createRetryableApiCall(mockApiCall, {
      maxAttempts: 2,
      baseDelayMs: 10
    })
    
    const result = await retryableCall()
    
    expect(result.success).toBe(false)
    expect(mockApiCall).toHaveBeenCalledTimes(1)
  })
})

describe('calculateRetryDelay', () => {
  it('should calculate exponential backoff correctly', () => {
    const delay1 = calculateRetryDelay(1, 1000, 10000, 2, false)
    const delay2 = calculateRetryDelay(2, 1000, 10000, 2, false)
    const delay3 = calculateRetryDelay(3, 1000, 10000, 2, false)
    
    expect(delay1).toBe(1000)
    expect(delay2).toBe(2000)
    expect(delay3).toBe(4000)
  })

  it('should respect max delay', () => {
    const delay = calculateRetryDelay(10, 1000, 5000, 2, false)
    expect(delay).toBe(5000)
  })

  it('should add jitter when enabled', () => {
    const delay1 = calculateRetryDelay(1, 1000, 10000, 2, true)
    const delay2 = calculateRetryDelay(1, 1000, 10000, 2, true)
    
    // With jitter, delays should be different
    expect(delay1).not.toBe(delay2)
    expect(delay1).toBeGreaterThan(1000)
    expect(delay1).toBeLessThan(1100) // 10% jitter max
  })

  it('should not add jitter when disabled', () => {
    const delay1 = calculateRetryDelay(1, 1000, 10000, 2, false)
    const delay2 = calculateRetryDelay(1, 1000, 10000, 2, false)
    
    expect(delay1).toBe(delay2)
    expect(delay1).toBe(1000)
  })
})
