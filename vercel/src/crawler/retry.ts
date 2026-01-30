import { captureException } from '@sentry/nextjs'

import { isRetryableError, UpstreamServerError } from './errors'

// Configuration for retry logic
export interface RetryConfig {
  backoffMultiplier: number
  initialDelay: number
  jitter: boolean
  maxDelay: number
  maxRetries: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  jitter: true,
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context?: Record<string, unknown>,
): Promise<T> {
  let lastError: unknown
  let delay = config.initialDelay

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error
      }

      // Don't retry if we've exhausted attempts
      if (attempt === config.maxRetries) {
        if (error instanceof Error) {
          captureException(error, {
            level: 'warning',
            tags: { retry_attempt: attempt + 1 },
            extra: { ...context, delay, cause: error.cause },
          })
        }
        break
      }

      let currentDelay = delay
      const retryAfter = error instanceof UpstreamServerError ? error.retryAfter : null
      const retryAfterDelay = parseRetryAfter(retryAfter)

      if (retryAfterDelay) {
        // Use Retry-After value, but respect maxDelay
        currentDelay = Math.min(retryAfterDelay, config.maxDelay)
      } else if (config.jitter) {
        currentDelay = delay * (0.5 + Math.random() * 0.5)
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay))

      // Increase delay for next attempt (only if not using Retry-After)
      if (!retryAfterDelay) {
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
      }
    }
  }

  throw lastError
}

function parseRetryAfter(retryAfter: string | null | undefined): number | null {
  if (!retryAfter) return null

  // If it's a number, treat it as seconds
  const seconds = Number(retryAfter)
  if (!isNaN(seconds) && seconds > 0) {
    return seconds * 1000 // Convert to milliseconds
  }

  // Otherwise, try to parse as HTTP date
  const retryDate = new Date(retryAfter)
  if (!isNaN(retryDate.getTime())) {
    const delay = retryDate.getTime() - Date.now()
    return delay > 0 ? delay : null
  }

  return null
}
