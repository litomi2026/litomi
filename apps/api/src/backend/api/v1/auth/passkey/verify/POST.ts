import type { AuthenticationResponseJSON } from '@simplewebauthn/server'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID } from '@litomi/auth/passkey'
import { authenticationLimiter, type PasskeyAuthenticationAttempt } from '@litomi/auth/passkey-authentication-attempt'
import { getAndDeleteChallenge } from '@litomi/auth/redis-challenge'
import { buildSessionDeviceLabel } from '@litomi/auth/session'
import { db } from '@litomi/db/database/supabase/drizzle'
import { COOKIE_DOMAIN } from '@litomi/domain/constants'
import { CookieKey } from '@litomi/domain/constants/storage'
import { ChallengeType } from '@litomi/domain/database/enum'
import { RateLimiter, RateLimitPresets } from '@litomi/http/rate-limit'
import { getRequestIP, getRequestUserAgent } from '@litomi/http/request'
import TurnstileValidator from '@litomi/http/turnstile'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'
import { z } from 'zod'

import { Env } from '@/backend'
import { readAdultFlag, touchUserLoginAtAndReturnProfile } from '@/backend/api/v1/auth/query'
import { issueAuthCookies } from '@/backend/api/v1/auth/session.query'
import { applyAuthCookie } from '@/backend/utils/cookie'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

import { readCredentialByCredentialId, touchCredentialUse } from './query'

export type POSTV1AuthPasskeyVerifyRequest = {
  authentication: AuthenticationResponseJSON
  remember: boolean
  turnstileToken?: string | null
}

export type POSTV1AuthPasskeyVerifyResponse = {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

const verifyAuthenticationSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
    userHandle: z.string().optional(),
  }),
  type: z.literal('public-key'),
  clientExtensionResults: z.record(z.string(), z.unknown()).optional().default({}),
})

const verifyAuthenticationRequestSchema = z.object({
  authentication: verifyAuthenticationSchema,
  remember: z.boolean().default(false),
  turnstileToken: z.string().nullable().optional(),
})

const verifyAuthenticationLimiter = new RateLimiter(RateLimitPresets.strict())

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', verifyAuthenticationRequestSchema), async (c) => {
  const remoteIP = getRequestIP(c.req.raw.headers)
  const { authentication, remember, turnstileToken } = c.req.valid('json')
  const { allowed, retryAfter } = await verifyAuthenticationLimiter.check(authentication.id)

  if (!allowed) {
    const seconds = retryAfter ?? 60
    const minutes = Math.max(1, Math.ceil(seconds / 60))

    return problemResponse(c, {
      status: 429,
      detail: `너무 많은 로그인 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`,
      headers: { 'Retry-After': String(seconds) },
    })
  }

  try {
    const authenticationAttemptId = getCookie(c, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)

    deleteCookie(c, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT, { domain: COOKIE_DOMAIN })

    if (!authenticationAttemptId) {
      return problemResponse(c, { status: 400, detail: '패스키를 검증할 수 없어요' })
    }

    const authenticationAttempt = await getAndDeleteChallenge<PasskeyAuthenticationAttempt>(
      authenticationAttemptId,
      ChallengeType.AUTHENTICATION,
    )

    if (!authenticationAttempt) {
      return problemResponse(c, { status: 400, detail: '패스키를 검증할 수 없어요' })
    }

    if (authenticationAttempt.turnstileRequired) {
      if (!turnstileToken) {
        return problemResponse(c, { status: 400, detail: 'Cloudflare 보안 검증을 완료해 주세요' })
      }

      const validator = new TurnstileValidator()

      const turnstile = await validator.validate({
        token: turnstileToken,
        remoteIP,
        expectedAction: 'login',
      })

      if (!turnstile.success) {
        return problemResponse(c, {
          status: 400,
          code: 'human-verification-failed',
          detail: validator.getTurnstileErrorMessage(turnstile['error-codes']),
        })
      }
    }

    const result = await db.transaction(async (tx) => {
      const credential = await readCredentialByCredentialId(tx, authentication.id)

      if (!credential) {
        return {
          ok: false,
          status: 404,
          detail: '패스키를 검증할 수 없어요',
        } as const
      }

      const { verified, authenticationInfo } = await verifyAuthenticationResponse({
        response: authentication,
        expectedChallenge: authenticationAttempt.challenge,
        expectedOrigin: WEBAUTHN_ORIGIN,
        expectedRPID: WEBAUTHN_RP_ID,
        credential: {
          publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
          id: credential.credentialId,
          counter: Number(credential.counter),
        },
      })

      if (!verified || !authenticationInfo) {
        return {
          ok: false,
          status: 400,
          detail: '패스키를 검증할 수 없어요',
        } as const
      }

      const newCounter =
        authenticationInfo.credentialDeviceType === 'singleDevice' ? authenticationInfo.newCounter : credential.counter

      const now = new Date()

      const [adult, user] = await Promise.all([
        readAdultFlag(credential.userId, tx),
        touchUserLoginAtAndReturnProfile(credential.userId, now, tx),
        touchCredentialUse(tx, authentication.id, newCounter, now),
      ])

      if (!user) {
        throw new Error(`User not found: ${credential.userId}`)
      }

      return {
        ok: true,
        user,
        adult,
      } as const
    })

    if (!result.ok) {
      return problemResponse(c, result)
    }

    const cookieConfigs = await issueAuthCookies({
      userId: result.user.id,
      adult: result.adult,
      remember,
      deviceLabel: remember ? buildSessionDeviceLabel(getRequestUserAgent(c.req.raw.headers)) : null,
    })

    applyAuthCookie(c, cookieConfigs)

    await Promise.allSettled([
      authenticationLimiter.reward(remoteIP),
      verifyAuthenticationLimiter.reward(authentication.id),
    ])

    return c.json<POSTV1AuthPasskeyVerifyResponse>(result.user)
  } catch (error) {
    console.error('verifyAuthentication:', error)
    return problemResponse(c, { status: 500, detail: '패스키 인증 중 오류가 발생했어요' })
  }
})

export default route
