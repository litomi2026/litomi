import type { RedisRateLimitCheck, RedisRateLimitResult } from '@/utils/rate-limit'

import { checkRedisRateLimits, RedisRateLimiter, RedisRateLimitPresets } from '@/utils/rate-limit'

export const DUMMY_PASSWORD_HASH = '$2b$10$dummyhashfortimingatackprevention'

export const loginIpLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'auth-login:ip',
})

export const loginIdLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'auth-login:id',
})

export const twoFactorIpLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'auth-login-2fa:ip',
})

export const twoFactorUserLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'auth-login-2fa:user',
})

export async function ensureAllowed(limitChecks: RedisRateLimitCheck[]) {
  const result: RedisRateLimitResult = await checkRedisRateLimits(limitChecks)

  if (result.allowed) {
    return { allowed: true as const }
  }

  return {
    allowed: false as const,
    retryAfter: result.retryAfter,
  }
}
