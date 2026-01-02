import type { Context } from 'hono'

import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import ms from 'ms'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'
import TurnstileValidator from '@/utils/turnstile'

import { POINTS_TURNSTILE_TTL_SECONDS, signPointsTurnstileToken } from '../util-turnstile-cookie'

export type POSTV1PointTurnstileResponse = { verified: true; expiresInSeconds: number }

const route = new Hono<Env>()

const TURNSTILE_VERIFY_TIMEOUT_MS = ms('10 seconds')
const turnstileValidator = new TurnstileValidator(TURNSTILE_VERIFY_TIMEOUT_MS, 1)

const requestSchema = z.object({
  token: z.string().min(1).max(2048),
})

route.post('/', zProblemValidator('json', requestSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  const { token } = c.req.valid('json')
  const remoteIP = getRemoteIP(c)

  const turnstile = await turnstileValidator.validate({
    token,
    remoteIP,
    expectedAction: 'points-earn',
  })

  if (!turnstile.success) {
    return problemResponse(c, {
      status: 400,
      code: 'turnstile-validation-failed',
      detail: '인증에 실패했어요. 다시 시도해 주세요',
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

function getRemoteIP(c: Context<Env>): string {
  return c.req.header('CF-Connecting-IP') || c.req.header('x-real-ip') || c.req.header('x-forwarded-for') || 'unknown'
}
