import 'server-only'

import { redisClient } from '@/database/redis'
import { sec } from '@/utils/format/date'

type Action = 'attempt' | 'complete'

const WINDOW_SECONDS = Math.ceil(sec('15 minutes'))

const LIMITS: Record<Action, number> = {
  attempt: 20,
  complete: 20,
}

type Result = { allowed: false; retryAfterSeconds: number } | { allowed: true }

export async function checkBBatonRateLimit(action: Action, userId: number): Promise<Result> {
  const key = `rate-limit:bbaton:${action}:${userId}`
  const rawCount = await redisClient.incr(key)
  const count = typeof rawCount === 'number' ? rawCount : Number(rawCount)

  if (count === 1) {
    await redisClient.expire(key, WINDOW_SECONDS)
  }

  const limit = LIMITS[action]
  if (count <= limit) {
    return { allowed: true }
  }

  const rawTTL = await redisClient.ttl(key).catch(() => null)
  const ttl = typeof rawTTL === 'number' ? rawTTL : rawTTL == null ? null : Number(rawTTL)

  return {
    allowed: false,
    retryAfterSeconds: ttl && ttl > 0 ? ttl : WINDOW_SECONDS,
  }
}
