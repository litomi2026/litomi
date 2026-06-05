import type { POSTV1AuthPasskeyOptionsResponse } from '@litomi/contracts'

import { getPasskeyAuthenticationAttemptCookieConfig } from '@litomi/auth/cookie'
import { WEBAUTHN_RP_ID } from '@litomi/auth/passkey/server'
import { storeChallenge } from '@litomi/auth/redis-challenge'
import { ChallengeType } from '@litomi/domain/auth/model'
import { getRequestIP } from '@litomi/http/request'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'

import { passkeyAuthOptionLimiter } from '../rate-limit'

const route = new Hono<Env>()

route.post('/', async (c) => {
  const remoteIP = getRequestIP(c.req.raw.headers)
  const { allowed, retryAfter, limit, remaining } = await passkeyAuthOptionLimiter.check(remoteIP)

  if (!allowed) {
    return tooManyRequestsProblemResponse(c, retryAfter)
  }

  try {
    const options = await generateAuthenticationOptions({
      rpID: WEBAUTHN_RP_ID,
      userVerification: 'required',
    })

    const authenticationAttemptId = crypto.randomUUID()
    const authAttemptCookie = getPasskeyAuthenticationAttemptCookieConfig(authenticationAttemptId)
    const turnstileRequired = limit !== undefined && remaining !== undefined && limit - remaining >= 4

    await storeChallenge(authenticationAttemptId, ChallengeType.AUTHENTICATION, {
      challenge: options.challenge,
      turnstileRequired,
    })

    setCookie(c, authAttemptCookie.key, authAttemptCookie.value, authAttemptCookie.options)

    return c.json<POSTV1AuthPasskeyOptionsResponse>({ options, turnstileRequired })
  } catch (error) {
    console.error('getAuthenticationOptions:', error)
    return problemResponse(c, { status: 500, detail: '패스키 인증 중 오류가 발생했어요' })
  }
})

export default route
