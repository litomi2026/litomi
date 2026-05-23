import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID } from '@litomi/auth/passkey'
import { getAndDeleteChallenge } from '@litomi/auth/redis-challenge'
import { postV1MePasskeyVerifyBodySchema, type POSTV1MePasskeyVerifyResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { credentialTable } from '@litomi/db/app/passkey'
import { ChallengeType, encodeDeviceType } from '@litomi/domain/database/enum'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1MePasskeyVerifyBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { registration } = c.req.valid('json')

  try {
    const challenge = await getAndDeleteChallenge(userId, ChallengeType.REGISTRATION)

    if (!challenge) {
      return problemResponse(c, { status: 403, detail: '패스키를 등록할 수 없어요' })
    }

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: registration,
      expectedChallenge: challenge,
      expectedOrigin: WEBAUTHN_ORIGIN,
      expectedRPID: WEBAUTHN_RP_ID,
    })

    if (!verified || !registrationInfo) {
      return problemResponse(c, { status: 403, detail: '패스키를 등록할 수 없어요' })
    }

    const { id: credentialId, counter, transports, publicKey } = registrationInfo.credential

    await db.insert(credentialTable).values({
      credentialId,
      counter,
      publicKey: Buffer.from(publicKey).toString('base64'),
      deviceType: encodeDeviceType(registration.authenticatorAttachment),
      transports,
      userId,
      createdAt: new Date(),
    })

    return c.json<POSTV1MePasskeyVerifyResponse>({
      credentialId,
      message: '패스키를 등록했어요',
    })
  } catch (error) {
    console.error('verifyRegistration:', error)
    return problemResponse(c, { status: 500, detail: '패스키 등록 중 오류가 발생했어요' })
  }
})

export default route
