import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { type POSTV1BBatonUnlinkResponse, PROBLEM, postV1BBatonUnlinkBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { bbatonVerificationTable } from '@litomi/db/app/bbaton'
import { twoFactorTable } from '@litomi/db/app/two-factor'
import { userTable } from '@litomi/db/app/user'
import { compare } from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { reissueAuthCookies } from './query'

const route = new Hono<Env>()

route.post('/', requireAuth, zProblemValidator('json', postV1BBatonUnlinkBodySchema), async (c) => {
  const userId = c.get('userId')!

  try {
    const [user] = await db
      .select({ passwordHash: userTable.passwordHash })
      .from(userTable)
      .where(eq(userTable.id, userId))

    if (!user) {
      return problemResponse(c, { problem: PROBLEM.CREDENTIAL_VERIFICATION_FAILED })
    }

    const { password, token } = c.req.valid('json')
    const isValidPassword = await compare(password, user.passwordHash).catch(() => false)

    if (!isValidPassword) {
      return problemResponse(c, { problem: PROBLEM.CREDENTIAL_VERIFICATION_FAILED })
    }

    const [twoFactor] = await db
      .select({ secret: twoFactorTable.secret })
      .from(twoFactorTable)
      .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

    if (twoFactor) {
      if (!token) {
        return problemResponse(c, { problem: PROBLEM.CREDENTIAL_VERIFICATION_FAILED })
      }

      const secret = decryptTOTPSecret(twoFactor.secret)
      const isValidToken = await verifyTOTPToken(token, secret)

      if (!isValidToken) {
        return problemResponse(c, { problem: PROBLEM.CREDENTIAL_VERIFICATION_FAILED })
      }
    }

    await db.delete(bbatonVerificationTable).where(eq(bbatonVerificationTable.userId, userId))
    await reissueAuthCookies(c, { userId, adult: false })

    return c.json({ ok: true } satisfies POSTV1BBatonUnlinkResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
