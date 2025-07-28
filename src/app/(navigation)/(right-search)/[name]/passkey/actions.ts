'use server'

import {
  AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID, WEBAUTHN_RP_NAME } from '@/constants/env'
import { db } from '@/database/drizzle'
import { ChallengeType, decodeDeviceType, encodeDeviceType } from '@/database/enum'
import { challengeTable, credentialTable, userTable } from '@/database/schema'
import { getUserIdFromAccessToken, setAccessTokenCookie } from '@/utils/cookie'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'

import { getAuthenticationOptionsSchema, verifyAuthenticationSchema, verifyRegistrationSchema } from './schema'
import { generateFakeCredentials } from './utils'

const THREE_MINUTES = 3 * 60 * 1000

export async function deleteCredential(credentialId: string, username?: string) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId || !username) {
    return { success: false, error: 'Unauthorized' } as const
  }

  try {
    const [deletedCredential] = await db
      .delete(credentialTable)
      .where(sql`${credentialTable.id} = ${credentialId} AND ${credentialTable.userId} = ${userId}`)
      .returning({ id: credentialTable.id })

    if (!deletedCredential) {
      return { success: false, error: 'Not Found' } as const
    }

    revalidatePath(`/@${username}/passkey`)

    return { success: true }
  } catch (error) {
    console.error('deleteCredential:', error)
    return { success: false, error: 'Internal Server Error' } as const
  }
}

const authenticationOptionsLimiter = new RateLimiter(RateLimitPresets.strict())

export async function getAuthenticationOptions(loginId: string) {
  const validation = getAuthenticationOptionsSchema.safeParse({ loginId })

  if (!validation.success) {
    return { success: false, error: 'Bad Request' } as const
  }

  const { allowed, retryAfter } = await authenticationOptionsLimiter.check(loginId)

  if (!allowed) {
    return { success: false, error: 'Too Many Requests', retryAfter } as const
  }

  try {
    const userWithCredentials = await db
      .select({
        userId: userTable.id,
        credentialId: credentialTable.id,
        transports: credentialTable.transports,
      })
      .from(userTable)
      .leftJoin(credentialTable, sql`${credentialTable.userId} = ${userTable.id}`)
      .where(sql`${userTable.loginId} = ${loginId}`)

    const userId = userWithCredentials[0]?.userId

    const allowCredentials = userId
      ? userWithCredentials
          .filter((credential) => credential.credentialId)
          .map((credential) => ({
            id: credential.credentialId!,
            ...(credential.transports && { transports: credential.transports as AuthenticatorTransportFuture[] }),
          }))
      : generateFakeCredentials(loginId)

    const options = await generateAuthenticationOptions({
      rpID: WEBAUTHN_RP_ID,
      allowCredentials,
      userVerification: 'required',
    })

    if (userId) {
      await db
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

    return { success: true, options } as const
  } catch (error) {
    console.error('getAuthenticationOptions:', error)
    return { success: false, error: 'Internal Server Error' } as const
  }
}

export async function getRegistrationOptions() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return { success: false, error: 'Unauthorized' } as const
  }

  try {
    const [user] = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        loginId: userTable.loginId,
        nickname: userTable.nickname,
      })
      .from(userTable)
      .where(sql`${userTable.id} = ${userId}`)

    if (!user) {
      return { success: false, error: 'Not Found' } as const
    }

    const existingCredentials = await db
      .select({
        id: credentialTable.id,
        transports: credentialTable.transports,
      })
      .from(credentialTable)
      .where(sql`${credentialTable.userId} = ${user.id}`)

    const options = await generateRegistrationOptions({
      rpName: WEBAUTHN_RP_NAME,
      rpID: WEBAUTHN_RP_ID,
      userName: user.loginId,
      userID: new Uint8Array(Buffer.from(user.id.toString())),
      userDisplayName: user.nickname || user.name,
      attestationType: 'direct',
      excludeCredentials: existingCredentials.map((c) => ({
        id: c.id,
        ...(c.transports?.length && { transports: c.transports as AuthenticatorTransportFuture[] }),
      })),
      authenticatorSelection: {
        userVerification: 'required',
        residentKey: 'required',
      },
    })

    await db
      .insert(challengeTable)
      .values({
        userId: user.id,
        challenge: options.challenge,
        type: ChallengeType.REGISTRATION,
        expiresAt: new Date(Date.now() + THREE_MINUTES),
      })
      .onConflictDoUpdate({
        target: [challengeTable.userId, challengeTable.type],
        set: { challenge: options.challenge, expiresAt: new Date(Date.now() + THREE_MINUTES) },
      })

    return { success: true, options } as const
  } catch (error) {
    console.error('getRegistrationOptions:', error)
    return { success: false, error: 'Internal Server Error' } as const
  }
}

export async function verifyAuthentication(body: unknown) {
  const validation = verifyAuthenticationSchema.safeParse(body)

  if (!validation.success) {
    return { success: false, error: 'Bad Request' }
  }

  const validatedData = validation.data

  try {
    const credentialId = validatedData.id

    const [result] = await db
      .select({
        credential: credentialTable,
        challenge: challengeTable.challenge,
      })
      .from(credentialTable)
      .leftJoin(
        challengeTable,
        sql`${challengeTable.userId} = ${credentialTable.userId} 
            AND ${challengeTable.type} = ${ChallengeType.AUTHENTICATION} 
            AND ${challengeTable.expiresAt} > NOW()`,
      )
      .where(sql`${credentialTable.id} = ${validatedData.id}`)

    const { credential, challenge } = result ?? {}

    if (!challenge || !credential) {
      return { success: false, error: 'Unauthorized' }
    }

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
      return { success: false, error: 'Forbidden' }
    }

    const newCounter =
      authenticationInfo.credentialDeviceType === 'singleDevice' ? authenticationInfo.newCounter : credential.counter

    await db.transaction((tx) =>
      Promise.all([
        tx
          .update(credentialTable)
          .set({ counter: newCounter })
          .where(sql`${credentialTable.id} = ${credentialId}`),
        tx
          .delete(challengeTable)
          .where(
            sql`${challengeTable.userId} = ${credential.userId} AND ${challengeTable.type} = ${ChallengeType.AUTHENTICATION}`,
          ),
      ]),
    )

    const cookieStore = await cookies()

    await Promise.all([
      setAccessTokenCookie(cookieStore, credential.userId),
      db
        .update(userTable)
        .set({ loginAt: new Date() })
        .where(sql`${userTable.id} = ${credential.userId}`),
    ])

    return { success: true }
  } catch (error) {
    console.error('verifyAuthentication:', error)
    return { success: false, error: 'Internal Server Error' }
  }
}

export async function verifyRegistration(body: unknown, username?: string) {
  const validation = verifyRegistrationSchema.safeParse(body)

  if (!validation.success) {
    return { success: false, error: 'Bad Request' } as const
  }

  const registrationResponse = validation.data
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId || !username) {
    return { success: false, error: 'Unauthorized' } as const
  }

  try {
    const [stored] = await db
      .select({ challenge: challengeTable.challenge })
      .from(challengeTable)
      .where(
        sql`${challengeTable.userId} = ${userId} AND ${challengeTable.type} = ${ChallengeType.REGISTRATION} AND ${challengeTable.expiresAt} > NOW()`,
      )

    if (!stored) {
      return { success: false, error: 'Forbidden' } as const
    }

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: stored.challenge,
      expectedOrigin: WEBAUTHN_ORIGIN,
      expectedRPID: WEBAUTHN_RP_ID,
    })

    if (!verified || !registrationInfo) {
      return { success: false, error: 'Forbidden' } as const
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

    await db.transaction((tx) =>
      Promise.all([
        tx.insert(credentialTable).values(newPasskey),
        tx
          .delete(challengeTable)
          .where(sql`${challengeTable.userId} = ${userId} AND ${challengeTable.type} = ${ChallengeType.REGISTRATION}`),
      ]),
    )

    revalidatePath(`/@${username}/passkey`)

    return {
      success: true,
      passkey: {
        id: newPasskey.id,
        createdAt: newPasskey.createdAt,
        deviceType: decodeDeviceType(newPasskey.deviceType),
        transports: newPasskey.transports,
      },
    } as const
  } catch (error) {
    console.error('verifyRegistration:', error)
    return { success: false, error: 'Internal Server Error' } as const
  }
}
