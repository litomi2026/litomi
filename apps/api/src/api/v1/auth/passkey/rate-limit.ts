import { RedisRateLimiter, RedisRateLimitPresets } from '@/utils/rate-limit'

export const passkeyAuthOptionLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.balanced(),
  scope: 'auth-passkey-options:ip',
})

export const passkeyAuthVerifyLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'auth-passkey-verify:credential',
})
