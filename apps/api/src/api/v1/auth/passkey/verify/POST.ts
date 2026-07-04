import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID } from '@litomi/auth/passkey/server'
import type { PasskeyAuthenticationAttempt } from '@litomi/auth/passkey-authentication-attempt'
import { getAndDeleteChallenge } from '@litomi/auth/redis-challenge'
import { buildSessionDeviceLabel } from '@litomi/auth/session'
import { type POSTV1AuthPasskeyVerifyResponse, PROBLEM, postV1AuthPasskeyVerifyRequestSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { credentialTable } from '@litomi/db/app/passkey'
import { ChallengeType } from '@litomi/domain/auth/model'
import { CookieKey } from '@litomi/http/cookie'
import { getRequestIP, getRequestUserAgent } from '@litomi/http/request'
import TurnstileValidator from '@litomi/http/turnstile'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { and, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'
import { readAdultFlag, touchUserLoginAtAndReturnProfile } from '@/api/v1/auth/query'
import { issueAuthCookies } from '@/api/v1/auth/session.query'
import type { Env } from '@/app'
import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { passkeyAuthOptionLimiter, passkeyAuthVerifyLimiter } from '../rate-limit'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1AuthPasskeyVerifyRequestSchema), async (c) => {
  const remoteIP = getRequestIP(c.req.raw.headers)
  const { authentication, remember, turnstileToken } = c.req.valid('json')
  const { allowed, retryAfter } = await passkeyAuthVerifyLimiter.check(authentication.id)

  if (!allowed) {
    return tooManyRequestsProblemResponse(c, retryAfter)
  }

  try {
    const authenticationAttemptId = getCookie(c, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
    deleteCookie(c, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT, { path: '/', secure: true })

    if (!authenticationAttemptId) {
      return problemResponse(c, { problem: PROBLEM.PASSKEY_VERIFICATION_FAILED })
    }

    const authenticationAttempt = await getAndDeleteChallenge<PasskeyAuthenticationAttempt>(
      authenticationAttemptId,
      ChallengeType.AUTHENTICATION,
    )

    if (!authenticationAttempt) {
      return problemResponse(c, { problem: PROBLEM.PASSKEY_VERIFICATION_FAILED })
    }

    if (authenticationAttempt.turnstileRequired) {
      if (!turnstileToken) {
        return problemResponse(c, { problem: PROBLEM.TURNSTILE_REQUIRED, status: 400 })
      }

      const validator = new TurnstileValidator()

      const turnstile = await validator.validate({
        token: turnstileToken,
        remoteIP,
        expectedAction: 'login',
      })

      if (!turnstile.success) {
        return problemResponse(c, {
          problem: PROBLEM.HUMAN_VERIFICATION_FAILED,
          detail: validator.getTurnstileErrorMessage(turnstile['error-codes']),
        })
      }
    }

    const [credential] = await db
      .select({
        userId: credentialTable.userId,
        publicKey: credentialTable.publicKey,
        counter: credentialTable.counter,
        credentialId: credentialTable.credentialId,
      })
      .from(credentialTable)
      .where(eq(credentialTable.credentialId, authentication.id))

    if (!credential) {
      return problemResponse(c, { problem: PROBLEM.PASSKEY_VERIFICATION_FAILED, status: 404 })
    }

    const verification = await verifyAuthenticationResponse({
      response: authentication,
      expectedChallenge: authenticationAttempt.challenge,
      expectedOrigin: WEBAUTHN_ORIGIN,
      expectedRPID: WEBAUTHN_RP_ID,
      credential: {
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
        id: credential.credentialId,
        counter: Number(credential.counter),
      },
    }).catch(() => null)

    if (!verification?.verified || !verification.authenticationInfo) {
      return problemResponse(c, { problem: PROBLEM.PASSKEY_VERIFICATION_FAILED })
    }

    const { authenticationInfo } = verification

    const newCounter =
      authenticationInfo.credentialDeviceType === 'singleDevice' ? authenticationInfo.newCounter : credential.counter

    const now = new Date()

    const [credentialUse] = await db
      .update(credentialTable)
      .set({ counter: newCounter, lastUsedAt: now })
      .where(
        newCounter > credential.counter
          ? and(eq(credentialTable.credentialId, authentication.id), lt(credentialTable.counter, newCounter))
          : eq(credentialTable.credentialId, authentication.id),
      )
      .returning({ userId: credentialTable.userId })

    if (!credentialUse) {
      return problemResponse(c, { problem: PROBLEM.PASSKEY_VERIFICATION_FAILED })
    }

    const [adult, user] = await Promise.all([
      readAdultFlag(credentialUse.userId),
      touchUserLoginAtAndReturnProfile(credentialUse.userId, now),
    ])

    if (!user) {
      return problemResponse(c, { problem: PROBLEM.PASSKEY_VERIFICATION_FAILED })
    }

    const cookieConfigs = await issueAuthCookies({
      userId: user.id,
      adult,
      remember,
      deviceLabel: remember ? buildSessionDeviceLabel(getRequestUserAgent(c.req.raw.headers)) : null,
    })

    applyAuthCookie(c, cookieConfigs)

    await Promise.allSettled([
      passkeyAuthOptionLimiter.reward(remoteIP),
      passkeyAuthVerifyLimiter.reward(authentication.id),
    ])

    return c.json(user satisfies POSTV1AuthPasskeyVerifyResponse)
  } catch (error) {
    console.error('verifyAuthentication:', error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
