import { COOKIE_DOMAIN } from '@litomi/domain/constants'
import { CookieKey } from '@litomi/domain/constants/storage'
import { getRequestIP } from '@litomi/http/request'
import TurnstileValidator from '@litomi/http/turnstile'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import ms from 'ms'
import { z } from 'zod'

import type { Env } from '@/backend/app'

import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

import { POINTS_TURNSTILE_TTL_SECONDS, signPointsTurnstileToken } from '../util-turnstile-cookie'

export type POSTV1PointTurnstileResponse = { verified: true; expiresInSeconds: number }

const route = new Hono<Env>()

const turnstileValidator = new TurnstileValidator(ms('10 seconds'), 1)

const requestSchema = z.object({
  token: z.string().min(1).max(2048),
})

route.post('/', requireAuth, zProblemValidator('json', requestSchema), async (c) => {
  const userId = c.get('userId')!
  const { token } = c.req.valid('json')
  const remoteIP = getRequestIP(c.req.raw.headers)

  const turnstile = await turnstileValidator.validate({
    token,
    remoteIP,
    expectedAction: 'points-earn',
  })

  if (!turnstile.success) {
    return problemResponse(c, {
      status: 400,
      code: 'human-verification-failed',
      detail: '보안 확인에 실패했어요',
    })
  }

  const signedCookie = await signPointsTurnstileToken(userId)

  setCookie(c, CookieKey.POINTS_TURNSTILE, signedCookie, {
    domain: COOKIE_DOMAIN,
    httpOnly: true,
    maxAge: POINTS_TURNSTILE_TTL_SECONDS,
    path: '/api/v1/points',
    sameSite: 'strict',
    secure: true,
  })

  return c.json<POSTV1PointTurnstileResponse>({
    verified: true,
    expiresInSeconds: POINTS_TURNSTILE_TTL_SECONDS,
  })
})

export default route
