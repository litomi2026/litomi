import { redis } from '@litomi/db/redis'
import { sec } from '@litomi/std'
import crypto from 'crypto'

const RATE_LIMIT_CHECK_SCRIPT = `
local window = tonumber(ARGV[1])
local current = redis.call("INCR", KEYS[1])

if current == 1 then
  redis.call("EXPIRE", KEYS[1], window)
end

local ttl = redis.call("TTL", KEYS[1])

if ttl < 0 then
  redis.call("EXPIRE", KEYS[1], window)
  ttl = window
end

return {current, ttl}
`

const RATE_LIMIT_REWARD_SCRIPT = `
local decrement = tonumber(ARGV[1])
local ttl = redis.call("TTL", KEYS[1])

if ttl <= 0 then
  return {0, ttl}
end

local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local next = current - decrement

if next < 0 then
  next = 0
end

redis.call("SET", KEYS[1], next, "EX", ttl)
return {next, ttl}
`

export type RedisRateLimitCheck = {
  identifier: string
  limiter: RedisRateLimiter
}

export type RedisRateLimitConfig = {
  failureMode?: RedisRateLimitFailureMode
  limit: number
  scope: string
  windowSeconds: number
}

export type RedisRateLimitFailureMode = 'closed' | 'open'

export type RedisRateLimitResult =
  | {
      allowed: false
      limit: number
      remaining: 0
      resetAt: Date | null
      retryAfter: number
    }
  | {
      allowed: true
      limit: number
      remaining: number
      resetAt: Date | null
      retryAfter?: undefined
    }

export class RedisRateLimiter {
  private readonly failureMode: RedisRateLimitFailureMode
  private readonly limit: number
  private readonly scope: string
  private readonly windowSeconds: number

  constructor(config: RedisRateLimitConfig) {
    this.failureMode = config.failureMode ?? 'open'
    this.limit = config.limit
    this.scope = config.scope
    this.windowSeconds = Math.ceil(config.windowSeconds)
  }

  async check(identifier: string): Promise<RedisRateLimitResult> {
    const key = createRedisRateLimitKey(this.scope, identifier)

    try {
      const [count, ttl] = parseRedisTuple(
        await redis.eval(RATE_LIMIT_CHECK_SCRIPT, 1, key, String(this.windowSeconds)),
      )

      const retryAfter = ttl > 0 ? ttl : this.windowSeconds
      const resetAt = new Date(Date.now() + retryAfter * 1000)

      if (count > this.limit) {
        return {
          allowed: false,
          limit: this.limit,
          remaining: 0,
          resetAt,
          retryAfter,
        }
      }

      return {
        allowed: true,
        limit: this.limit,
        remaining: Math.max(this.limit - count, 0),
        resetAt,
      }
    } catch (error) {
      console.error('RedisRateLimiter.check:', this.scope, error)

      if (this.failureMode === 'closed') {
        return {
          allowed: false,
          limit: this.limit,
          remaining: 0,
          resetAt: null,
          retryAfter: Math.min(this.windowSeconds, sec('1 minute')),
        }
      }

      return {
        allowed: true,
        limit: this.limit,
        remaining: this.limit,
        resetAt: null,
      }
    }
  }

  async reset(identifier: string): Promise<void> {
    const key = createRedisRateLimitKey(this.scope, identifier)

    try {
      await redis.del(key)
    } catch (error) {
      console.error('RedisRateLimiter.reset:', this.scope, error)
    }
  }

  async reward(identifier: string, count = 1): Promise<void> {
    const key = createRedisRateLimitKey(this.scope, identifier)

    try {
      await redis.eval(RATE_LIMIT_REWARD_SCRIPT, 1, key, String(count))
    } catch (error) {
      console.error('RedisRateLimiter.reward:', this.scope, error)
    }
  }
}

export const RedisRateLimitPresets = {
  lenient: (): Omit<RedisRateLimitConfig, 'scope'> => ({
    limit: 100,
    windowSeconds: sec('1 minute'),
  }),
  standard: (): Omit<RedisRateLimitConfig, 'scope'> => ({
    limit: 100,
    windowSeconds: sec('15 minutes'),
  }),
  balanced: (): Omit<RedisRateLimitConfig, 'scope'> => ({
    limit: 10,
    windowSeconds: sec('5 minutes'),
  }),
  strict: (): Omit<RedisRateLimitConfig, 'scope'> => ({
    limit: 10,
    windowSeconds: sec('15 minutes'),
  }),
}

export async function checkRedisRateLimits(checks: RedisRateLimitCheck[]): Promise<RedisRateLimitResult> {
  for (const { identifier, limiter } of checks) {
    const result = await limiter.check(identifier)

    if (!result.allowed) {
      return result
    }
  }

  return {
    allowed: true,
    limit: 0,
    remaining: 0,
    resetAt: null,
  }
}

function createRedisRateLimitKey(scope: string, identifier: string): string {
  const hashed = crypto.createHash('sha256').update(identifier).digest('base64url').slice(0, 22)
  return `rate-limit:${scope}:${hashed}`
}

function parseRedisTuple(value: unknown): [number, number] {
  if (!Array.isArray(value)) {
    return [0, 0]
  }

  return [Number(value[0]), Number(value[1])]
}
