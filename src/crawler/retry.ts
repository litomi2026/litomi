import { captureException } from '@sentry/nextjs'

import { isRetryableError } from './errors'

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

      // Calculate delay with optional jitter
      let currentDelay = delay
      if (config.jitter) {
        currentDelay = delay * (0.5 + Math.random() * 0.5)
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay))

      // Increase delay for next attempt
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
    }
  }

  throw lastError
}
