import { RateLimiter, RateLimitPresets } from '@litomi/http/rate-limit'

export const authenticationLimiter = new RateLimiter(RateLimitPresets.balanced())

export type PasskeyAuthenticationAttempt = {
  challenge: string
  turnstileRequired: boolean
}
