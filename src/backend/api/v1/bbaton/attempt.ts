import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import 'server-only'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { redisClient } from '@/database/redis'

import { BBATON_ATTEMPT_TTL_SECONDS, BBatonAttempt, buildAuthorizeUrl, generateAttemptId, getAttemptKey } from './utils'

export type POSTV1BBatonAttemptResponse = {
  authorizeUrl: string
  expiresIn: number
}

const route = new Hono<Env>()

route.post('/', async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  const attemptId = generateAttemptId()
  const attempt: BBatonAttempt = { userId }

  await redisClient.set(getAttemptKey(attemptId), attempt, { ex: BBATON_ATTEMPT_TTL_SECONDS }).catch(() => {
    throw new HTTPException(503, { message: '인증을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.' })
  })

  setCookie(c, CookieKey.BBATON_ATTEMPT_ID, attemptId, {
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
})

export default route
