import { RateLimiter, RateLimitPresets, type RateLimitResult } from '@litomi/http/rate-limit'

export const DUMMY_PASSWORD_HASH = '$2b$10$dummyhashfortimingatackprevention'

export const loginIpLimiter = new RateLimiter(RateLimitPresets.strict())
export const loginIdLimiter = new RateLimiter(RateLimitPresets.strict())
export const twoFactorIpLimiter = new RateLimiter(RateLimitPresets.strict())
export const twoFactorUserLimiter = new RateLimiter(RateLimitPresets.strict())

export async function ensureAllowed(limitChecks: Promise<RateLimitResult>[]) {
  const results = await Promise.all(limitChecks)
  const blocked = results.filter((result) => !result.allowed)

  if (blocked.length === 0) {
    return { allowed: true as const }
  }

  const retryAfter = Math.max(...blocked.map((result) => result.retryAfter ?? 60))
  const minutes = Math.max(1, Math.ceil(retryAfter / 60))

  return {
    allowed: false as const,
    retryAfter,
    minutes,
  }
}
