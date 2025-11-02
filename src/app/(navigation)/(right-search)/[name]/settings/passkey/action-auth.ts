'use server'

import { captureException } from '@sentry/nextjs'
import {
  AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { z } from 'zod'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID } from '@/constants'
import { ChallengeType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { credentialTable, userTable } from '@/database/supabase/schema'
import { badRequest, forbidden, internalServerError, ok, tooManyRequests, unauthorized } from '@/utils/action-response'
import { getAccessTokenCookieConfig } from '@/utils/cookie'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import { getAndDeleteChallenge, storeChallenge } from '@/utils/redis-challenge'
import TurnstileValidator from '@/utils/turnstile'

import { generateFakeCredentials, hasCredentialId } from './utils'

const getAuthenticationOptionsSchema = z.object({ loginId: z.string() })

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

const authenticationLimiter = new RateLimiter(RateLimitPresets.strict())

export async function getAuthenticationOptions(loginId: string) {
  const validation = getAuthenticationOptionsSchema.safeParse({ loginId })

  if (!validation.success) {
    return badRequest('잘못된 요청이에요')
  }

  const { allowed, retryAfter } = await authenticationLimiter.check(loginId)

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 로그인 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`)
  }

  try {
    const userWithCredentials = await db
      .select({
        userId: userTable.id,
        credentialId: credentialTable.credentialId,
        transports: credentialTable.transports,
      })
      .from(userTable)
      .leftJoin(credentialTable, eq(credentialTable.userId, userTable.id))
      .where(eq(userTable.loginId, loginId))

    // NOTE: 존재하지 않는 로그인 아이디로 요청한 경우 빈 배열이 반환됨
    const userId = userWithCredentials[0]?.userId

    const allowCredentials = userId
      ? userWithCredentials.filter(hasCredentialId).map((credential) => ({
          id: credential.credentialId,
          ...(credential.transports && { transports: credential.transports as AuthenticatorTransportFuture[] }),
        }))
      : generateFakeCredentials(loginId)

    const options = await generateAuthenticationOptions({
      rpID: WEBAUTHN_RP_ID,
      allowCredentials,
      userVerification: 'required',
    })

    await Promise.all([
      userId && storeChallenge(userId, ChallengeType.AUTHENTICATION, options.challenge),
      authenticationLimiter.reward(loginId),
    ])

    return ok(options)
  } catch (error) {
    console.error('getAuthenticationOptions:', error)
    captureException(error, { extra: { name: 'getAuthenticationOptions', loginId } })
    return internalServerError('패스키 인증 중 오류가 발생했어요')
  }
}

const verifyAuthenticationLimiter = new RateLimiter(RateLimitPresets.strict())

export async function verifyAuthentication(body: unknown, turnstileToken: string) {
  const validator = new TurnstileValidator()
  const headersList = await headers()

  const remoteIP =
    headersList.get('CF-Connecting-IP') ||
    headersList.get('x-real-ip') ||
    headersList.get('x-forwarded-for') ||
    'unknown'

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
        return unauthorized('패스키를 검증할 수 없어요')
      }

      const challenge = await getAndDeleteChallenge(credential.userId, ChallengeType.AUTHENTICATION)

      if (!challenge) {
        return unauthorized('패스키를 검증할 수 없어요')
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
        return forbidden('패스키를 검증할 수 없어요')
      }

      const newCounter =
        authenticationInfo.credentialDeviceType === 'singleDevice' ? authenticationInfo.newCounter : credential.counter

      const [[user]] = await Promise.all([
        tx.update(userTable).set({ loginAt: new Date() }).where(eq(userTable.id, credential.userId)).returning({
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
            lastUsedAt: new Date(),
          })
          .where(eq(credentialTable.credentialId, validatedData.id)),
        cookies().then((cookieStore) =>
          getAccessTokenCookieConfig(credential.userId).then(({ key, value, options }) =>
            cookieStore.set(key, value, options),
          ),
        ),
      ])

      return ok(user)
    })

    return result
  } catch (error) {
    console.error('verifyAuthentication:', error)
    captureException(error, { extra: { name: 'verifyAuthentication', userId: validatedData.id } })
    return internalServerError('패스키 인증 중 오류가 발생했어요')
  }
}
