import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { verifyBackupCode } from '@litomi/auth/two-factor-backup-code'
import { type DELETEV1MeTwoFactorResponse, deleteV1MeTwoFactorBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { twoFactorBackupCodeTable, twoFactorTable } from '@litomi/db/app/two-factor'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { RedisRateLimiter, RedisRateLimitPresets } from '@/utils/rate-limit'
import { zProblemValidator } from '@/utils/validator'

const twoFactorDisableLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'me-two-factor-disable:user',
})

const route = new Hono<Env>()

route.delete('/', zProblemValidator('json', deleteV1MeTwoFactorBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { token } = c.req.valid('json')
  const { allowed, retryAfter } = await twoFactorDisableLimiter.check(String(userId))

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

      let isValidToken: boolean

      if (token.length === 6) {
        const secret = decryptTOTPSecret(twoFactor.secret)
        isValidToken = await verifyTOTPToken(token, secret)
      } else {
        const backupCodes = await tx
          .select({ codeHash: twoFactorBackupCodeTable.codeHash })
          .from(twoFactorBackupCodeTable)
          .where(eq(twoFactorBackupCodeTable.userId, userId))

        const verifications = await Promise.all(backupCodes.map(({ codeHash }) => verifyBackupCode(token, codeHash)))
        isValidToken = verifications.some(Boolean)
      }

      if (!isValidToken) {
        return { kind: 'invalid-token' } as const
      }

      await tx.delete(twoFactorTable).where(eq(twoFactorTable.userId, userId))

      return { kind: 'disabled' } as const
    })

    switch (result.kind) {
      case 'disabled':
        await Promise.allSettled([twoFactorDisableLimiter.reward(String(userId))])
        return c.json({ message: '2단계 인증이 비활성화됐어요' } satisfies DELETEV1MeTwoFactorResponse)

      case 'invalid-token':
        return problemResponse(c, { status: 400, detail: '잘못된 인증 코드예요' })

      case 'not-found':
        return problemResponse(c, { status: 404, detail: '활성화된 2단계 인증이 없어요' })
    }
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '2단계 인증 비활성화 중 오류가 발생했어요' })
  }
})

export default route
