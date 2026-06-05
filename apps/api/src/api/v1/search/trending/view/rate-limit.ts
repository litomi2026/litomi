import { sec } from '@litomi/std'

import { checkRedisRateLimits, RedisRateLimiter } from '@/utils/rate-limit'

const IP_WINDOW_SECONDS = sec('1 minute')
const IP_LIMIT = 60
const QUERY_WINDOW_SECONDS = sec('10 minutes')
const IP_QUERY_LIMIT = 20
const USER_QUERY_LIMIT = 3

const ipLimiter = new RedisRateLimiter({
  scope: 'search-trending-view:ip',
  limit: IP_LIMIT,
  windowSeconds: IP_WINDOW_SECONDS,
})

const ipQueryLimiter = new RedisRateLimiter({
  scope: 'search-trending-view:ip-query',
  limit: IP_QUERY_LIMIT,
  windowSeconds: QUERY_WINDOW_SECONDS,
})

const userQueryLimiter = new RedisRateLimiter({
  scope: 'search-trending-view:user-query',
  limit: USER_QUERY_LIMIT,
  windowSeconds: QUERY_WINDOW_SECONDS,
})

type Params = {
  query: string
  remoteIP: string
  userId?: number
}

type Result = { allowed: false; retryAfterSeconds: number } | { allowed: true }

export async function checkSearchTrendingViewRateLimit({ query, remoteIP, userId }: Params): Promise<Result> {
  const checks = [
    { limiter: ipLimiter, identifier: remoteIP },
    { limiter: ipQueryLimiter, identifier: `${remoteIP}:${query}` },
  ]

  if (userId) {
    checks.push({ limiter: userQueryLimiter, identifier: `${userId}:${query}` })
  }

  const rateLimit = await checkRedisRateLimits(checks)

  if (rateLimit.allowed) {
    return { allowed: true }
  }

  return {
    allowed: false,
    retryAfterSeconds: rateLimit.retryAfter,
  }
}
