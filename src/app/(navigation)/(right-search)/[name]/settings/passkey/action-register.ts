'use server'

import { captureException } from '@sentry/nextjs'
import {
  AuthenticatorTransportFuture,
  generateRegistrationOptions,
  RegistrationResponseJSON,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID, WEBAUTHN_RP_NAME } from '@/constants'
import { MAX_CREDENTIALS_PER_USER } from '@/constants/policy'
import { ChallengeType, encodeDeviceType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { credentialTable, userTable } from '@/database/supabase/schema'
import { badRequest, forbidden, internalServerError, noContent, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { getAndDeleteChallenge, storeChallenge } from '@/utils/redis-challenge'

import { hasCredentialId } from './utils'

const verifyRegistrationSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    attestationObject: z.string(),
    clientDataJSON: z.string(),
    transports: z.array(z.enum(['ble', 'hybrid', 'internal', 'nfc', 'usb'])).optional(),
    publicKeyAlgorithm: z.number().optional(),
    publicKey: z.string().optional(),
    authenticatorData: z.string().optional(),
  }),
  type: z.literal('public-key'),
  clientExtensionResults: z.object({}).optional().default({}),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
})

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
