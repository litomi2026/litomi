import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server'

import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'

import { WEBAUTHN_RP_ID } from '@/app/(navigation)/(right-search)/[name]/settings/passkey/common'
import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { ChallengeType } from '@/database/enum'
import { getPasskeyAuthenticationAttemptCookieConfig } from '@/utils/cookie'
import { storeChallenge } from '@/utils/redis-challenge'
import { getRequestIP } from '@/utils/request'

import { authenticationLimiter } from '../shared'

export type POSTV1AuthPasskeyOptionsResponse = {
  options: PublicKeyCredentialRequestOptionsJSON
  turnstileRequired: boolean
}

const route = new Hono<Env>()

route.post('/', async (c) => {
  const remoteIP = getRequestIP(c.req.raw.headers)
  const rateLimitResult = await authenticationLimiter.check(remoteIP)

  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.retryAfter ?? 60
    const minutes = Math.max(1, Math.ceil(retryAfter / 60))

    return problemResponse(c, {
      status: 429,
      detail: `너무 많은 로그인 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`,
      headers: { 'Retry-After': String(retryAfter) },
    })
  }

  try {
    const options = await generateAuthenticationOptions({
      rpID: WEBAUTHN_RP_ID,
      userVerification: 'required',
    })

    const authenticationAttemptId = crypto.randomUUID()
    const authAttemptCookie = getPasskeyAuthenticationAttemptCookieConfig(authenticationAttemptId)
    const turnstileRequired = shouldRequireTurnstile(rateLimitResult)

    await storeChallenge(authenticationAttemptId, ChallengeType.AUTHENTICATION, {
      challenge: options.challenge,
      turnstileRequired,
    })

    setCookie(c, authAttemptCookie.key, authAttemptCookie.value, authAttemptCookie.options)

    return c.json<POSTV1AuthPasskeyOptionsResponse>({
      options,
      turnstileRequired,
    })
  } catch (error) {
    console.error('getAuthenticationOptions:', error)
    return problemResponse(c, { status: 500, detail: '패스키 인증 중 오류가 발생했어요' })
  }
})

export default route

function shouldRequireTurnstile({ limit, remaining }: { limit?: number; remaining?: number }) {
  if (limit === undefined || remaining === undefined) {
    return false
  }

  return limit - remaining >= 4
}
