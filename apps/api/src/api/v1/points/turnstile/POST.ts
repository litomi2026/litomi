import { type POSTV1PointTurnstileResponse, PROBLEM, postV1PointTurnstileRequestSchema } from '@litomi/contracts'
import { CookieKey } from '@litomi/http/cookie'
import { getRequestIP } from '@litomi/http/request'
import TurnstileValidator from '@litomi/http/turnstile'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import ms from 'ms'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { POINTS_TURNSTILE_TTL_SECONDS, signPointsTurnstileToken } from '../util-turnstile-cookie'

const route = new Hono<Env>()
const turnstileValidator = new TurnstileValidator(ms('10 seconds'), 1)

route.post('/', requireAuth, zProblemValidator('json', postV1PointTurnstileRequestSchema), async (c) => {
  const userId = c.get('userId')!
  const { token } = c.req.valid('json')
  const remoteIP = getRequestIP(c.req.raw.headers)

  const turnstile = await turnstileValidator.validate({
    token,
    remoteIP,
    expectedAction: 'points-earn',
  })

  if (!turnstile.success) {
    return problemResponse(c, { problem: PROBLEM.HUMAN_VERIFICATION_FAILED })
  }

  const signedCookie = await signPointsTurnstileToken(userId)

  setCookie(c, CookieKey.POINTS_TURNSTILE, signedCookie, {
    httpOnly: true,
    maxAge: POINTS_TURNSTILE_TTL_SECONDS,
    path: '/api/v1/points',
    sameSite: 'strict',
    secure: true,
  })

  return c.json({
    verified: true,
    expiresInSeconds: POINTS_TURNSTILE_TTL_SECONDS,
  } satisfies POSTV1PointTurnstileResponse)
})

export default route
