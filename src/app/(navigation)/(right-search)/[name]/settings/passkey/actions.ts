'use server'

import { captureException } from '@sentry/nextjs'
import {
  AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID, WEBAUTHN_RP_NAME } from '@/constants'
import { MAX_CREDENTIALS_PER_USER } from '@/constants/policy'
import { ChallengeType, encodeDeviceType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { credentialTable, userTable } from '@/database/supabase/schema'
import {
  badRequest,
  forbidden,
  internalServerError,
  noContent,
  notFound,
  ok,
  tooManyRequests,
  unauthorized,
} from '@/utils/action-response'
import { setAccessTokenCookie, validateUserIdFromCookie } from '@/utils/cookie'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import { getAndDeleteChallenge, storeChallenge } from '@/utils/redis-challenge'
import TurnstileValidator from '@/utils/turnstile'

import {
  deleteCredentialSchema,
  getAuthenticationOptionsSchema,
  verifyAuthenticationSchema,
  verifyRegistrationSchema,
} from './schema'
import { generateFakeCredentials } from './utils'

export async function deleteCredential(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = deleteCredentialSchema.safeParse({ 'credential-id': formData.get('credential-id') })

  if (!validation.success) {
    return badRequest('잘못된 요청이에요')
  }

  const { 'credential-id': credentialId } = validation.data

  try {
    const [deletedCredential] = await db
      .delete(credentialTable)
      .where(and(eq(credentialTable.id, credentialId), eq(credentialTable.userId, userId)))
      .returning({ id: credentialTable.id })

    if (!deletedCredential) {
      return notFound('패스키를 찾을 수 없어요')
    }

    revalidatePath('/[name]/settings', 'page')
    return ok('패스키가 삭제됐어요')
  } catch (error) {
    console.error('deleteCredential:', error)
    captureException(error, { extra: { name: 'deleteCredential', userId } })
    return internalServerError('패스키 삭제 중 오류가 발생했어요')
  }
}

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

export async function getRegistrationOptions() {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    const existingCredentials = await db
      .select({
        userId: userTable.id,
        name: userTable.name,
        loginId: userTable.loginId,
        nickname: userTable.nickname,
        credentialId: credentialTable.credentialId,
        transports: credentialTable.transports,
      })
      .from(userTable)
      .leftJoin(credentialTable, eq(credentialTable.userId, userTable.id))
      .where(eq(userTable.id, userId))

    const user = existingCredentials[0]

    if (existingCredentials.length >= MAX_CREDENTIALS_PER_USER) {
      return badRequest(`최대 ${MAX_CREDENTIALS_PER_USER}개의 패스키만 등록할 수 있어요`)
    }

    const excludeCredentials = existingCredentials.filter(hasCredentialId).map((c) => ({
      id: c.credentialId,
      ...(c.transports?.length && { transports: c.transports as AuthenticatorTransportFuture[] }),
    }))

    const options = await generateRegistrationOptions({
      rpName: WEBAUTHN_RP_NAME,
      rpID: WEBAUTHN_RP_ID,
      userName: user.loginId,
      userID: new Uint8Array(Buffer.from(user.userId.toString())),
      userDisplayName: user.nickname || user.name,
      attestationType: 'direct',
      excludeCredentials,
      authenticatorSelection: {
        userVerification: 'required',
        residentKey: 'required',
      },
    })

    await storeChallenge(user.userId, ChallengeType.REGISTRATION, options.challenge)

    return ok(options)
  } catch (error) {
    console.error('getRegistrationOptions:', error)
    captureException(error, { extra: { name: 'getRegistrationOptions', userId } })
    return internalServerError('패스키 등록 중 오류가 발생했어요')
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
        cookies().then((cookieStore) => {
          setAccessTokenCookie(cookieStore, credential.userId)
        }),
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

export async function verifyRegistration(body: RegistrationResponseJSON) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = verifyRegistrationSchema.safeParse(body)

  if (!validation.success) {
    return badRequest('잘못된 요청이에요')
  }

  const registrationResponse = validation.data

  try {
    const challenge = await getAndDeleteChallenge(userId, ChallengeType.REGISTRATION)

    if (!challenge) {
      return forbidden('패스키를 등록할 수 없어요')
    }

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challenge,
      expectedOrigin: WEBAUTHN_ORIGIN,
      expectedRPID: WEBAUTHN_RP_ID,
    })

    if (!verified || !registrationInfo) {
      return forbidden('패스키를 등록할 수 없어요')
    }

    const { credential } = registrationInfo
    const { id: credentialId, counter, transports, publicKey } = credential

    const newPasskey = {
      credentialId: credentialId,
      counter,
      publicKey: Buffer.from(publicKey).toString('base64'),
      deviceType: encodeDeviceType(registrationResponse.authenticatorAttachment),
      transports,
      userId,
      createdAt: new Date(),
    }

    await db.insert(credentialTable).values(newPasskey)
    revalidatePath('/[name]/settings', 'page')

    return noContent()
  } catch (error) {
    console.error('verifyRegistration:', error)
    captureException(error, { extra: { name: 'verifyRegistration', userId } })
    return internalServerError('패스키 등록 중 오류가 발생했어요')
  }
}

function hasCredentialId<T extends { credentialId: string | null }>(value: T): value is T & { credentialId: string } {
  return value.credentialId !== null
}
