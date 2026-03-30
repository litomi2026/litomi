'use server'

import { captureException } from '@sentry/nextjs'
import {
  AuthenticationResponseJSON,
  generateAuthenticationOptions,
  PublicKeyCredentialRequestOptionsJSON,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { z } from 'zod'

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
  getRefreshTokenCookieConfig,
} from '@/utils/cookie'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import { getAndDeleteChallengePayload, storeChallengePayload } from '@/utils/redis-challenge'
import TurnstileValidator from '@/utils/turnstile'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID } from './common'

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
  remember: z.boolean(),
  turnstileToken: z.string().nullable().optional(),
})

const authenticationLimiter = new RateLimiter(RateLimitPresets.balanced())

export type GetAuthenticationOptionsResponse = {
  options: PublicKeyCredentialRequestOptionsJSON
  turnstileRequired: boolean
}

export type VerifyAuthenticationRequest = {
  authentication: AuthenticationResponseJSON
  remember: boolean
  turnstileToken?: string | null
}

type PasskeyAuthenticationAttempt = {
  challenge: string
  turnstileRequired: boolean
}

export async function getAuthenticationOptions() {
  const headersList = await headers()
  const remoteIP = getRemoteAddress(headersList)
  const rateLimitResult = await authenticationLimiter.check(remoteIP)
  const { allowed, retryAfter } = rateLimitResult

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
    const turnstileRequired = shouldRequireTurnstile(rateLimitResult)

    await storeChallengePayload(authenticationAttemptId, ChallengeType.AUTHENTICATION, {
      challenge: options.challenge,
      turnstileRequired,
    } satisfies PasskeyAuthenticationAttempt)

    cookieStore.set(authAttemptCookie.key, authAttemptCookie.value, authAttemptCookie.options)

    return ok<GetAuthenticationOptionsResponse>({
      options,
      turnstileRequired,
    })
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

export async function verifyAuthentication(body: unknown) {
  const headersList = await headers()
  const remoteIP = getRemoteAddress(headersList)
  const validation = verifyAuthenticationRequestSchema.safeParse(body)

  if (!validation.success) {
    return badRequest('패스키를 검증할 수 없어요')
  }

  const { authentication: validatedData, remember, turnstileToken } = validation.data
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

    const authenticationAttempt = await getAndDeleteChallengePayload<PasskeyAuthenticationAttempt>(
      authenticationAttemptId,
      ChallengeType.AUTHENTICATION,
    )

    if (!authenticationAttempt) {
      return badRequest('패스키를 검증할 수 없어요')
    }

    if (authenticationAttempt.turnstileRequired) {
      if (!turnstileToken) {
        return badRequest('Cloudflare 보안 검증을 완료해 주세요')
      }

      const validator = new TurnstileValidator()

      const turnstile = await validator.validate({
        token: turnstileToken,
        remoteIP,
        expectedAction: 'login',
      })

      if (!turnstile.success) {
        const message = validator.getTurnstileErrorMessage(turnstile['error-codes'])
        return badRequest(message)
      }
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

      const { verified, authenticationInfo } = await verifyAuthenticationResponse({
        response: validatedData,
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
      cookieStore.set(accessTokenCookie.key, accessTokenCookie.value, accessTokenCookie.options)

      if (remember) {
        const refreshTokenCookie = await getRefreshTokenCookieConfig(tokenClaims)
        const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: refreshTokenCookie.options.maxAge })

        cookieStore.set(refreshTokenCookie.key, refreshTokenCookie.value, refreshTokenCookie.options)
        cookieStore.set(authHintCookie.key, authHintCookie.value, authHintCookie.options)
      } else {
        const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: accessTokenCookie.options.maxAge })
        cookieStore.set(authHintCookie.key, authHintCookie.value, authHintCookie.options)
      }

      return ok(user)
    })

    if (result.ok) {
      await Promise.allSettled([
        authenticationLimiter.reward(remoteIP),
        verifyAuthenticationLimiter.reward(validatedData.id),
      ])
    }

    return result
  } catch (error) {
    console.error('verifyAuthentication:', error)
    captureException(error, { extra: { name: 'verifyAuthentication', credentialId: validatedData.id, remoteIP } })
    return internalServerError('패스키 인증 중 오류가 발생했어요')
  }
}

function shouldRequireTurnstile({ limit, remaining }: { limit?: number; remaining?: number }) {
  if (limit === undefined || remaining === undefined) {
    return false
  }

  const attemptCount = limit - remaining
  return attemptCount >= 4
}
