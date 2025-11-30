/**
 * Enhanced fetch utility with better error handling and retry logic
 * Updated for Next.js 15.5.2 + Turbopack compatibility
 */

interface FetchOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

interface FetchError extends Error {
  status?: number
  statusText?: string
  response?: Response
  code?: string
}

/**
 * Get base URL for absolute URL conversion
 * Compatible with Next.js 15.5.2 + Turbopack
 */
function getBaseUrl(): string {
  // Client-side: use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_APP_URL || 
         process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
         'http://localhost:3000'
}

/**
 * Convert relative URL to absolute URL for Next.js 15.5.2 compatibility
 */
function toAbsoluteUrl(url: string): string {
  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Relative URL - convert to absolute
  const baseUrl = getBaseUrl()
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

/**
 * Enhanced fetch with timeout and retry logic
 * Compatible with Next.js 15.5.2 + Turbopack
 */
export async function fetchWithErrorHandling(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 30000, // 30 seconds default
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  // Convert to absolute URL for Next.js 15.5.2 compatibility
  const absoluteUrl = toAbsoluteUrl(url)

  let lastError: FetchError | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        // Use absolute URL for Next.js 15.5.2 compatibility
        const response = await fetch(absoluteUrl, {
          ...fetchOptions,
          signal: controller.signal,
          // Ensure headers are set properly
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        })

        clearTimeout(timeoutId)

        // Handle network errors
        if (!response.ok) {
          const error: FetchError = new Error(
            `HTTP ${response.status}: ${response.statusText}`
          ) as FetchError
          error.status = response.status
          error.statusText = response.statusText
          error.response = response
          error.code = 'HTTP_ERROR'

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error
          }

          // Retry on server errors (5xx) if retries available
          if (attempt < retries && response.status >= 500) {
            lastError = error
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            continue
          }

          throw error
        }

        return response
      } catch (fetchError) {
        clearTimeout(timeoutId)

        // Handle AbortError (timeout)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          const error: FetchError = new Error(
            `Request timeout after ${timeout}ms`
          ) as FetchError
          error.code = 'TIMEOUT'

          if (attempt < retries) {
            lastError = error
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            continue
          }

          throw error
        }

        // Handle network errors (connection failed, CORS, etc.)
        // Enhanced error detection for Next.js 15.5.2
        if (
          fetchError instanceof TypeError &&
          (fetchError.message.includes('fetch') || 
           fetchError.message.includes('Failed to fetch') ||
           fetchError.message.includes('NetworkError') ||
           fetchError.message.includes('Network request failed'))
        ) {
          const error: FetchError = new Error(
            `Network error: Failed to fetch ${absoluteUrl}. Please check your internet connection and API server status.`
          ) as FetchError
          error.code = 'NETWORK_ERROR'
          error.cause = fetchError

          // Enhanced logging for debugging
          if (process.env.NODE_ENV === 'development') {
            console.error('Fetch error details:', {
              url: absoluteUrl,
              originalUrl: url,
              attempt: attempt + 1,
              maxRetries: retries,
              error: fetchError.message,
              stack: fetchError instanceof Error ? fetchError.stack : undefined
            })
          }

          if (attempt < retries) {
            lastError = error
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            continue
          }

          throw error
        }

        // Re-throw other errors
        throw fetchError
      }
    } catch (error) {
      lastError = error as FetchError

      // Don't retry on last attempt
      if (attempt === retries) {
        break
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }

  // If we get here, all retries failed
  if (lastError) {
    throw lastError
  }

  throw new Error('Unknown error: All fetch attempts failed')
}

/**
 * Fetch JSON with error handling
 */
export async function fetchJSON<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithErrorHandling(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  try {
    const data = await response.json()
    return data as T
  } catch (jsonError) {
    const error: FetchError = new Error(
      'Failed to parse JSON response'
    ) as FetchError
    error.code = 'JSON_PARSE_ERROR'
    error.cause = jsonError as Error
    throw error
  }
}

/**
 * Fetch with authentication token
 */
export async function fetchWithAuth<T = unknown>(
  url: string,
  token: string,
  options: FetchOptions = {}
): Promise<T> {
  return fetchJSON<T>(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}

