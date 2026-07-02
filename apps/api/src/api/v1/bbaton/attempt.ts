import type { POSTV1BBatonAttemptResponse } from '@litomi/contracts'

import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { RedisRateLimiter } from '@/utils/rate-limit'

import { storeBBatonOAuthAttempt } from './state'
import {
  BBATON_ATTEMPT_TTL_SECONDS,
  BBATON_RATE_LIMIT,
  BBATON_RATE_LIMIT_WINDOW_SECONDS,
  buildAuthorizeUrl,
  createBBatonState,
} from './utils'

const bbatonAttemptLimiter = new RedisRateLimiter({
  scope: 'bbaton:attempt',
  limit: BBATON_RATE_LIMIT,
  windowSeconds: BBATON_RATE_LIMIT_WINDOW_SECONDS,
})

const route = new Hono<Env>()

route.post('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  try {
    const rateLimit = await bbatonAttemptLimiter.check(String(userId))

    if (!rateLimit.allowed) {
      return tooManyRequestsProblemResponse(c, rateLimit.retryAfter)
    }

    const state = createBBatonState()
    await storeBBatonOAuthAttempt(state, { userId })

    return c.json({
      authorizeUrl: buildAuthorizeUrl(state),
      expiresIn: BBATON_ATTEMPT_TTL_SECONDS,
    } satisfies POSTV1BBatonAttemptResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '비바톤 인증을 시작하지 못했어요.' })
  }
})

export default route
