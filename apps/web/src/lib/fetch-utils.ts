/**
 * Enhanced fetch utility with better error handling and retry logic
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
 * Enhanced fetch with timeout and retry logic
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

  let lastError: FetchError | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
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
        if (
          fetchError instanceof TypeError &&
          fetchError.message.includes('fetch')
        ) {
          const error: FetchError = new Error(
            'Network error: Failed to fetch. Please check your internet connection.'
          ) as FetchError
          error.code = 'NETWORK_ERROR'
          error.cause = fetchError

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

