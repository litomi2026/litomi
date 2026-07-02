import { WEBAUTHN_RP_ID, WEBAUTHN_RP_NAME } from '@litomi/auth/passkey/server'
import { storeChallenge } from '@litomi/auth/redis-challenge'
import type { POSTV1MePasskeyOptionsResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { credentialTable } from '@litomi/db/app/passkey'
import { userTable } from '@litomi/db/app/user'
import { ChallengeType } from '@litomi/domain/auth/model'
import { MAX_CREDENTIALS_PER_USER } from '@litomi/domain/auth/policy'
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()

route.post('/', async (c) => {
  const userId = c.get('userId')!

  try {
    const rows = await db
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

    const user = rows[0]

    if (!user) {
      return problemResponse(c, { status: 404, detail: '사용자를 찾을 수 없어요' })
    }

    const credentials = rows.flatMap(({ credentialId, transports }) =>
      credentialId ? [{ credentialId, transports }] : [],
    )

    if (credentials.length >= MAX_CREDENTIALS_PER_USER) {
      return problemResponse(c, {
        status: 400,
        detail: `최대 ${MAX_CREDENTIALS_PER_USER}개의 패스키만 등록할 수 있어요`,
      })
    }

    const excludeCredentials = credentials.map(({ credentialId, transports }) => ({
      id: credentialId,
      ...(transports?.length && { transports: transports as AuthenticatorTransportFuture[] }),
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

    await storeChallenge(userId, ChallengeType.REGISTRATION, options.challenge)

    return c.json({ options } satisfies POSTV1MePasskeyOptionsResponse)
  } catch (error) {
    console.error('getRegistrationOptions:', error)
    return problemResponse(c, { status: 500, detail: '패스키 등록 중 오류가 발생했어요' })
  }
})

export default route
