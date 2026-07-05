import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { generateBackupCodes } from '@litomi/auth/two-factor-backup-code'
import {
  type POSTV1MeTwoFactorBackupCodesResponse,
  PROBLEM,
  postV1MeTwoFactorBackupCodesBodySchema,
} from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { twoFactorBackupCodeTable, twoFactorTable } from '@litomi/db/app/two-factor'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { RedisRateLimiter, RedisRateLimitPresets } from '@/utils/rate-limit'
import { zProblemValidator } from '@/utils/validator'

const twoFactorBackupCodesLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'me-two-factor-backup-codes:user',
})

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', postV1MeTwoFactorBackupCodesBodySchema))

route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { token } = c.req.valid('json')
  const { allowed, retryAfter } = await twoFactorBackupCodesLimiter.check(String(userId))

  if (!allowed) {
    return tooManyRequestsProblemResponse(c, retryAfter)
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [twoFactor] = await tx
        .select({ secret: twoFactorTable.secret })
        .from(twoFactorTable)
        .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))
        .for('update')

      if (!twoFactor) {
        return { kind: 'not-found' } as const
      }

      const secret = decryptTOTPSecret(twoFactor.secret)
      const isValidToken = await verifyTOTPToken(token, secret)

      if (!isValidToken) {
        return { kind: 'invalid-token' } as const
      }

      const { codes, hashedCodes } = await generateBackupCodes(8)

      await tx.delete(twoFactorBackupCodeTable).where(eq(twoFactorBackupCodeTable.userId, userId))
      await tx.insert(twoFactorBackupCodeTable).values(hashedCodes.map((codeHash) => ({ userId, codeHash })))

      return { kind: 'regenerated', backupCodes: codes } as const
    })

    switch (result.kind) {
      case 'invalid-token':
        return problemResponse(c, { problem: PROBLEM.TWO_FACTOR_TOKEN_INVALID })

      case 'not-found':
        return problemResponse(c, { problem: PROBLEM.TWO_FACTOR_NOT_ENABLED })

      case 'regenerated':
        await Promise.allSettled([twoFactorBackupCodesLimiter.reward(String(userId))])
        return c.json({ backupCodes: result.backupCodes } satisfies POSTV1MeTwoFactorBackupCodesResponse)
    }
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
