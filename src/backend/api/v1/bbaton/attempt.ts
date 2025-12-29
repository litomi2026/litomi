import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import 'server-only'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'

import { BBATON_ATTEMPT_TTL_SECONDS, buildAuthorizeUrl, signBBatonAttemptToken } from './utils'

export type POSTV1BBatonAttemptResponse = {
  authorizeUrl: string
  expiresIn: number
}

const route = new Hono<Env>()

route.post('/', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  try {
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
