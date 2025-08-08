'use server'

import {
  AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID, WEBAUTHN_RP_NAME } from '@/constants/env'
import { db, sessionDB } from '@/database/drizzle'
import { ChallengeType, decodeDeviceType, encodeDeviceType } from '@/database/enum'
import { challengeTable, credentialTable, userTable } from '@/database/schema'
import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
  tooManyRequests,
  unauthorized,
} from '@/utils/action-response'
import { setAccessTokenCookie } from '@/utils/cookie'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import { getUserIdFromCookie } from '@/utils/session'

import {
  deleteCredentialSchema,
  getAuthenticationOptionsSchema,
  verifyAuthenticationSchema,
  verifyRegistrationSchema,
} from './schema'
import { generateFakeCredentials } from './utils'

const THREE_MINUTES = 3 * 60 * 1000
const MAX_CREDENTIALS_PER_USER = 10

export async function deleteCredential(formData: FormData) {
  const userId = await getUserIdFromCookie()

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
      .where(sql`${credentialTable.id} = ${credentialId} AND ${credentialTable.userId} = ${userId}`)
      .returning({ id: credentialTable.id })

    if (!deletedCredential) {
      return notFound('패스키를 찾을 수 없어요')
    }

    revalidatePath('/[name]/passkey', 'page')
    return ok('패스키가 삭제됐어요')
  } catch (error) {
    console.error('deleteCredential:', error)
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
    const options = await sessionDB.transaction(async (tx) => {
      const userWithCredentials = await tx
        .select({
          userId: userTable.id,
          credentialId: credentialTable.id,
          transports: credentialTable.transports,
        })
        .from(userTable)
        .leftJoin(credentialTable, sql`${credentialTable.userId} = ${userTable.id}`)
        .where(sql`${userTable.loginId} = ${loginId}`)

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

      if (userId) {
        await tx
          .insert(challengeTable)
          .values({
            userId,
            challenge: options.challenge,
            type: ChallengeType.AUTHENTICATION,
            expiresAt: new Date(Date.now() + THREE_MINUTES),
          })
          .onConflictDoUpdate({
            target: [challengeTable.userId, challengeTable.type],
            set: { challenge: options.challenge, expiresAt: new Date(Date.now() + THREE_MINUTES) },
          })
      }

      return options
    })

    await authenticationLimiter.reward(loginId)
    return ok(options)
  } catch (error) {
    console.error('getAuthenticationOptions:', error)
    return internalServerError('패스키 인증 중 오류가 발생했어요')
  }
}

export async function getRegistrationOptions() {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    const result = await sessionDB.transaction(async (tx) => {
      const existingCredentials = await tx
        .select({
          userId: userTable.id,
          name: userTable.name,
          loginId: userTable.loginId,
          nickname: userTable.nickname,
          credentialId: credentialTable.id,
          transports: credentialTable.transports,
        })
        .from(userTable)
        .leftJoin(credentialTable, sql`${credentialTable.userId} = ${userTable.id}`)
        .where(sql`${userTable.id} = ${userId}`)

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

      await tx
        .insert(challengeTable)
        .values({
          userId: user.userId,
          challenge: options.challenge,
          type: ChallengeType.REGISTRATION,
          expiresAt: new Date(Date.now() + THREE_MINUTES),
        })
        .onConflictDoUpdate({
          target: [challengeTable.userId, challengeTable.type],
          set: { challenge: options.challenge, expiresAt: new Date(Date.now() + THREE_MINUTES) },
        })

      return options
    })

    if ('error' in result) {
      return result
    }

    return ok(result)
  } catch (error) {
    console.error('getRegistrationOptions:', error)
    return internalServerError('패스키 등록 중 오류가 발생했어요')
  }
}

export async function verifyAuthentication(body: unknown) {
  const validation = verifyAuthenticationSchema.safeParse(body)

  if (!validation.success) {
    return badRequest('잘못된 요청이에요')
  }

  const validatedData = validation.data

  try {
    const result = await sessionDB.transaction(async (tx) => {
      const [result] = await tx
        .select({
          credential: credentialTable,
          challenge: challengeTable.challenge,
        })
        .from(credentialTable)
        .innerJoin(challengeTable, sql`${challengeTable.userId} = ${credentialTable.userId}`)
        .where(
          sql`${credentialTable.id} = ${validatedData.id} 
            AND ${challengeTable.type} = ${ChallengeType.AUTHENTICATION} 
            AND ${challengeTable.expiresAt} > NOW()`,
        )

      if (!result) {
        return unauthorized('패스키를 검증할 수 없어요')
      }

      const { credential, challenge } = result

      const { verified, authenticationInfo } = await verifyAuthenticationResponse({
        response: validatedData,
        expectedChallenge: challenge,
        expectedOrigin: WEBAUTHN_ORIGIN,
        expectedRPID: WEBAUTHN_RP_ID,
        credential: {
          publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
          id: credential.id,
          counter: Number(credential.counter),
        },
      })

      if (!verified || !authenticationInfo) {
        return forbidden('패스키를 검증할 수 없어요')
      }

      const newCounter =
        authenticationInfo.credentialDeviceType === 'singleDevice' ? authenticationInfo.newCounter : credential.counter

      const [[user]] = await Promise.all([
        tx
          .update(userTable)
          .set({ loginAt: new Date() })
          .where(sql`${userTable.id} = ${credential.userId}`)
          .returning({
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
          .where(sql`${credentialTable.id} = ${validatedData.id}`),
        tx
          .delete(challengeTable)
          .where(sql`${challengeTable.userId} = ${credential.userId} AND ${challengeTable.expiresAt} < NOW()`),
        cookies().then((cookieStore) => {
          setAccessTokenCookie(cookieStore, credential.userId)
        }),
      ])

      return user
    })

    if ('error' in result) {
      return result
    }

    return ok(result)
  } catch (error) {
    console.error('verifyAuthentication:', error)
    return internalServerError('패스키 인증 중 오류가 발생했어요')
  }
}

export async function verifyRegistration(body: RegistrationResponseJSON) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = verifyRegistrationSchema.safeParse(body)

  if (!validation.success) {
    return badRequest('잘못된 요청이에요')
  }

  const registrationResponse = validation.data

  try {
    const result = await sessionDB.transaction(async (tx) => {
      const [stored] = await tx
        .select({ challenge: challengeTable.challenge })
        .from(challengeTable)
        .where(
          sql`${challengeTable.userId} = ${userId} AND ${challengeTable.type} = ${ChallengeType.REGISTRATION} AND ${challengeTable.expiresAt} > NOW()`,
        )

      if (!stored) {
        return forbidden('패스키를 등록할 수 없어요')
      }

      const { verified, registrationInfo } = await verifyRegistrationResponse({
        response: registrationResponse,
        expectedChallenge: stored.challenge,
        expectedOrigin: WEBAUTHN_ORIGIN,
        expectedRPID: WEBAUTHN_RP_ID,
      })

      if (!verified || !registrationInfo) {
        return forbidden('패스키를 등록할 수 없어요')
      }

      const { credential } = registrationInfo
      const { id: credentialId, counter, transports, publicKey } = credential

      const newPasskey = {
        id: credentialId,
        counter,
        publicKey: Buffer.from(publicKey).toString('base64'),
        deviceType: encodeDeviceType(registrationResponse.authenticatorAttachment),
        transports,
        userId: Number(userId),
        createdAt: new Date(),
      }

      await Promise.all([
        tx.insert(credentialTable).values(newPasskey),
        tx
          .delete(challengeTable)
          .where(sql`${challengeTable.userId} = ${userId} AND ${challengeTable.expiresAt} < NOW()`),
      ])

      return newPasskey
    })

    if ('error' in result) {
      return result
    }

    revalidatePath('/[name]/passkey', 'page')

    return ok({
      ...result,
      deviceType: decodeDeviceType(result.deviceType),
    })
  } catch (error) {
    console.error('verifyRegistration:', error)
    return internalServerError('패스키 등록 중 오류가 발생했어요')
  }
}

function hasCredentialId<T extends { credentialId: string | null }>(value: T): value is T & { credentialId: string } {
  return value.credentialId !== null
}
