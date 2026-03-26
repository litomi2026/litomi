'use server'

import { captureException } from '@sentry/nextjs'
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { z } from 'zod'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID } from '@/constants'
import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { ChallengeType } from '@/database/enum'
import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'
import { credentialTable } from '@/database/supabase/passkey'
import { userTable } from '@/database/supabase/user'
import { badRequest, internalServerError, notFound, ok, tooManyRequests } from '@/utils/action-response'
import {
  getAccessTokenCookieConfig,
  getAuthHintCookieConfig,
  getPasskeyAuthenticationAttemptCookieConfig,
} from '@/utils/cookie'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import { getAndDeleteChallenge, storeChallenge } from '@/utils/redis-challenge'
import TurnstileValidator from '@/utils/turnstile'

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

const authenticationLimiter = new RateLimiter(RateLimitPresets.balanced())

export async function getAuthenticationOptions() {
  const headersList = await headers()
  const remoteIP = getRemoteAddress(headersList)
  const { allowed, retryAfter } = await authenticationLimiter.check(remoteIP)

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 로그인 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`)
  }

  try {
    const options = await generateAuthenticationOptions({
      rpID: WEBAUTHN_RP_ID,
      userVerification: 'required',
    })

    const authenticationAttemptId = crypto.randomUUID()
    const cookieStore = await cookies()
    const authAttemptCookie = getPasskeyAuthenticationAttemptCookieConfig(authenticationAttemptId)

    await Promise.all([
      storeChallenge(authenticationAttemptId, ChallengeType.AUTHENTICATION, options.challenge),
      cookieStore.set(authAttemptCookie.key, authAttemptCookie.value, authAttemptCookie.options),
    ])

    return ok(options)
  } catch (error) {
    console.error('getAuthenticationOptions:', error)
    captureException(error, { extra: { name: 'getAuthenticationOptions', remoteIP } })
    return internalServerError('패스키 인증 중 오류가 발생했어요')
  }
}

function getRemoteAddress(headersList: Awaited<ReturnType<typeof headers>>) {
  return (
    headersList.get('CF-Connecting-IP') ||
    headersList.get('x-real-ip') ||
    headersList.get('x-forwarded-for') ||
    'unknown'
  )
}

const verifyAuthenticationLimiter = new RateLimiter(RateLimitPresets.strict())

export async function verifyAuthentication(body: unknown, turnstileToken: string) {
  const validator = new TurnstileValidator()
  const headersList = await headers()
  const remoteIP = getRemoteAddress(headersList)

  const turnstile = await validator.validate({
    token: turnstileToken,
    remoteIP,
    expectedAction: 'login',
  })

  if (!turnstile.success) {
    const message = validator.getTurnstileErrorMessage(turnstile['error-codes'])
    return badRequest(message)
  }

  const validation = verifyAuthenticationSchema.safeParse(body)

  if (!validation.success) {
    return badRequest('잘못된 요청이에요')
  }

  const validatedData = validation.data
  const { allowed, retryAfter } = await verifyAuthenticationLimiter.check(validatedData.id)

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 로그인 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`)
  }

  try {
    const cookieStore = await cookies()
    const authenticationAttemptId = cookieStore.get(CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)?.value

    cookieStore.delete({
      name: CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT,
      domain: COOKIE_DOMAIN,
    })

    if (!authenticationAttemptId) {
      return badRequest('패스키를 검증할 수 없어요')
    }

    const result = await db.transaction(async (tx) => {
      const [credential] = await tx
        .select({
          userId: credentialTable.userId,
          publicKey: credentialTable.publicKey,
          counter: credentialTable.counter,
          credentialId: credentialTable.credentialId,
        })
        .from(credentialTable)
        .where(eq(credentialTable.credentialId, validatedData.id))

      if (!credential) {
        return notFound('패스키를 검증할 수 없어요')
      }

      const challenge = await getAndDeleteChallenge(authenticationAttemptId, ChallengeType.AUTHENTICATION)

      if (!challenge) {
        return badRequest('패스키를 검증할 수 없어요')
      }

      const { verified, authenticationInfo } = await verifyAuthenticationResponse({
        response: validatedData,
        expectedChallenge: challenge,
        expectedOrigin: WEBAUTHN_ORIGIN,
        expectedRPID: WEBAUTHN_RP_ID,
        credential: {
          publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
          id: credential.credentialId,
          counter: Number(credential.counter),
        },
      })

      if (!verified || !authenticationInfo) {
        return badRequest('패스키를 검증할 수 없어요')
      }

      const newCounter =
        authenticationInfo.credentialDeviceType === 'singleDevice' ? authenticationInfo.newCounter : credential.counter

      const now = new Date()

      const [verification, [user]] = await Promise.all([
        tx
          .select({ adultFlag: bbatonVerificationTable.adultFlag })
          .from(bbatonVerificationTable)
          .where(eq(bbatonVerificationTable.userId, credential.userId)),
        tx.update(userTable).set({ loginAt: now }).where(eq(userTable.id, credential.userId)).returning({
          id: userTable.id,
          loginId: userTable.loginId,
          name: userTable.name,
          lastLoginAt: userTable.loginAt,
          lastLogoutAt: userTable.logoutAt,
        }),
        tx
          .update(credentialTable)
          .set({
            counter: newCounter,
            lastUsedAt: now,
          })
          .where(eq(credentialTable.credentialId, validatedData.id)),
      ])

      const tokenClaims = {
        userId: credential.userId,
        adult: verification[0]?.adultFlag === true,
      }

      const accessTokenCookie = await getAccessTokenCookieConfig(tokenClaims)
      const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: accessTokenCookie.options.maxAge })

      cookieStore.set(accessTokenCookie.key, accessTokenCookie.value, accessTokenCookie.options)
      cookieStore.set(authHintCookie.key, authHintCookie.value, authHintCookie.options)

      return ok(user)
    })

    return result
  } catch (error) {
    console.error('verifyAuthentication:', error)
    captureException(error, { extra: { name: 'verifyAuthentication', credentialId: validatedData.id, remoteIP } })
    return internalServerError('패스키 인증 중 오류가 발생했어요')
  }
}
