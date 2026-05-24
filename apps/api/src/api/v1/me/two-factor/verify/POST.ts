import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { generateBackupCodes } from '@litomi/auth/two-factor-backup-code'
import { postV1MeTwoFactorVerifyBodySchema, type POSTV1MeTwoFactorVerifyResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { twoFactorBackupCodeTable, twoFactorTable } from '@litomi/db/app/two-factor'
import { RateLimiter, RateLimitPresets } from '@litomi/http/rate-limit'
import { and, eq, gt } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const twoFactorVerifyLimiter = new RateLimiter({
  ...RateLimitPresets.strict(),
  keyPrefix: 'rl:two-factor-verify:',
})

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1MeTwoFactorVerifyBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { token } = c.req.valid('json')
  const { allowed, retryAfter } = await twoFactorVerifyLimiter.check(String(userId))

  if (!allowed) {
    const seconds = retryAfter ?? 60
    const minutes = Math.max(1, Math.ceil(seconds / 60))

    return problemResponse(c, {
      status: 429,
      detail: `너무 많은 2단계 인증 확인 시도가 있었어요. ${minutes}분 후에 다시 시도해 주세요.`,
      headers: { 'Retry-After': String(seconds) },
    })
  }

  try {
    const result = await db.transaction(async (tx) => {
      const now = new Date()

      const [setup] = await tx
        .select({ secret: twoFactorTable.secret })
        .from(twoFactorTable)
        .where(and(eq(twoFactorTable.userId, userId), gt(twoFactorTable.expiresAt, now)))
        .for('update')

      if (!setup) {
        return { kind: 'expired' } as const
      }

      const secret = decryptTOTPSecret(setup.secret)
      const isValidToken = await verifyTOTPToken(token, secret)

      if (!isValidToken) {
        return { kind: 'invalid-token' } as const
      }

      const { codes, hashedCodes } = await generateBackupCodes(8)

      const [enabled] = await tx
        .update(twoFactorTable)
        .set({ expiresAt: null })
        .where(and(eq(twoFactorTable.userId, userId), gt(twoFactorTable.expiresAt, now)))
        .returning({ userId: twoFactorTable.userId })

      if (!enabled) {
        return { kind: 'expired' } as const
      }

      await tx.insert(twoFactorBackupCodeTable).values(
        hashedCodes.map((codeHash) => ({
          userId,
          codeHash,
        })),
      )

      return {
        kind: 'verified',
        backupCodes: codes,
      } as const
    })

    switch (result.kind) {
      case 'expired':
        return problemResponse(c, { status: 403, detail: '2단계 인증 설정이 만료됐어요' })

      case 'invalid-token':
        return problemResponse(c, { status: 400, detail: '잘못된 인증 코드예요' })

      case 'verified':
        await Promise.allSettled([twoFactorVerifyLimiter.reward(String(userId))])
        return c.json<POSTV1MeTwoFactorVerifyResponse>({ backupCodes: result.backupCodes })
    }
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '2단계 인증 활성화 중 오류가 발생했어요' })
  }
})

export default route
