import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import 'server-only'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'

import { checkBBatonRateLimit } from './rate-limit'
import { BBATON_ATTEMPT_TTL_SECONDS, buildAuthorizeUrl, signBBatonAttemptToken } from './utils'

export type POSTV1BBatonAttemptResponse = {
  authorizeUrl: string
  expiresIn: number
}

const route = new Hono<Env>()

route.post('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  try {
    const rateLimit = await checkBBatonRateLimit('attempt', userId)
    if (!rateLimit.allowed) {
      const minutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60))
      return problemResponse(c, {
        status: 429,
        detail: `너무 많은 인증 시도가 있었어요. ${minutes}분 후에 다시 시도해 주세요.`,
      })
    }

    const attemptToken = await signBBatonAttemptToken(userId)

    setCookie(c, CookieKey.BBATON_ATTEMPT_ID, attemptToken, {
      domain: COOKIE_DOMAIN,
      httpOnly: true,
      maxAge: BBATON_ATTEMPT_TTL_SECONDS,
      path: '/api/v1/bbaton',
      sameSite: 'strict',
      secure: true,
    })

    return c.json<POSTV1BBatonAttemptResponse>({
      authorizeUrl: buildAuthorizeUrl(),
      expiresIn: BBATON_ATTEMPT_TTL_SECONDS,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '비바톤 인증을 시작하지 못했어요.' })
  }
})

export default route
