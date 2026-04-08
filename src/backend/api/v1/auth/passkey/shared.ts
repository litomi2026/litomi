import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'

export const authenticationLimiter = new RateLimiter(RateLimitPresets.balanced())

export type PasskeyAuthenticationAttempt = {
  challenge: string
  turnstileRequired: boolean
}
