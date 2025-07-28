import { headers } from 'next/headers'
import 'server-only'

export interface RateLimitConfig {
  identifier?: string | ((req?: Request) => Promise<string>)
  keyPrefix?: string
  maxAttempts: number
  skipFailedRequests?: boolean
  skipSuccessfulRequests?: boolean
  windowMs: number
}

// Types
export interface RateLimitResult {
  allowed: boolean
  limit?: number
  remaining?: number
  resetAt?: Date
  retryAfter?: number
}

export interface RateLimitStore {
  cleanup(): Promise<void>
  decrement(key: string): Promise<void>
  increment(key: string): Promise<{ count: number; resetAt: number }>
  reset(key: string): Promise<void>
}

// In-memory store implementation
export class MemoryStore implements RateLimitStore {
  private attempts = new Map<string, { count: number; resetAt: number }>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(private windowMs: number) {
    // Clean up old entries periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000) // Every minute
  }

  async cleanup(): Promise<void> {
    const now = Date.now()
    for (const [key, value] of this.attempts.entries()) {
      if (value.resetAt < now) {
        this.attempts.delete(key)
      }
    }
  }

  async decrement(key: string): Promise<void> {
    const record = this.attempts.get(key)
    if (record && record.count > 0) {
      record.count--
      this.attempts.set(key, record)
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.attempts.clear()
  }

  async increment(key: string): Promise<{ count: number; resetAt: number }> {
    const now = Date.now()
    const record = this.attempts.get(key)

    // Clean up expired record
    if (record && record.resetAt < now) {
      this.attempts.delete(key)
    }

    const current = this.attempts.get(key) || {
      count: 0,
      resetAt: now + this.windowMs,
    }

    const updated = {
      count: current.count + 1,
      resetAt: current.resetAt,
    }

    this.attempts.set(key, updated)
    return updated
  }

  async reset(key: string): Promise<void> {
    this.attempts.delete(key)
  }
}

// Rate limiter class
export class RateLimiter {
  private config: Required<RateLimitConfig>
  private store: RateLimitStore

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      windowMs: config.windowMs,
      maxAttempts: config.maxAttempts,
      identifier: config.identifier || getDefaultIdentifier,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
      keyPrefix: config.keyPrefix ?? 'rl:',
    }

    this.store = store || new MemoryStore(this.config.windowMs)
  }

  async check(customIdentifier?: string): Promise<RateLimitResult> {
    const identifier =
      customIdentifier ||
      (typeof this.config.identifier === 'function' ? await this.config.identifier() : this.config.identifier)

    const key = `${this.config.keyPrefix}${identifier}`
    const record = await this.store.increment(key)

    if (record.count > this.config.maxAttempts) {
      const now = Date.now()
      const retryAfter = Math.ceil((record.resetAt - now) / 1000)

      return {
        allowed: false,
        retryAfter,
        remaining: 0,
        limit: this.config.maxAttempts,
        resetAt: new Date(record.resetAt),
      }
    }

    return {
      allowed: true,
      remaining: this.config.maxAttempts - record.count,
      limit: this.config.maxAttempts,
      resetAt: new Date(record.resetAt),
    }
  }

  async reset(customIdentifier?: string): Promise<void> {
    const identifier =
      customIdentifier ||
      (typeof this.config.identifier === 'function' ? await this.config.identifier() : this.config.identifier)

    const key = `${this.config.keyPrefix}${identifier}`
    await this.store.reset(key)
  }

  async reward(customIdentifier?: string, count: number = 1): Promise<void> {
    if (this.config.skipSuccessfulRequests) {
      const identifier =
        customIdentifier ||
        (typeof this.config.identifier === 'function' ? await this.config.identifier() : this.config.identifier)

      const key = `${this.config.keyPrefix}${identifier}`
      for (let i = 0; i < count; i++) {
        await this.store.decrement(key)
      }
    }
  }
}

// Default identifier extractor
async function getDefaultIdentifier(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown'
}

export const RateLimitPresets = {
  // Strict: for authentication, sensitive operations
  strict: (): RateLimitConfig => ({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
  }),

  // Standard: for general API endpoints
  standard: (): RateLimitConfig => ({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100,
  }),

  // Lenient: for public endpoints
  lenient: (): RateLimitConfig => ({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxAttempts: 100,
  }),
}
