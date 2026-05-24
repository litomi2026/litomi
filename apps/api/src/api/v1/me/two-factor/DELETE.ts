import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { deleteV1MeTwoFactorBodySchema, type DELETEV1MeTwoFactorResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { twoFactorTable } from '@litomi/db/app/two-factor'
import { RateLimiter, RateLimitPresets } from '@litomi/http/rate-limit'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const twoFactorDisableLimiter = new RateLimiter({
  ...RateLimitPresets.strict(),
  keyPrefix: 'rl:two-factor-disable:',
})

const route = new Hono<Env>()

route.delete('/', zProblemValidator('json', deleteV1MeTwoFactorBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { token } = c.req.valid('json')
  const { allowed, retryAfter } = await twoFactorDisableLimiter.check(String(userId))

  if (!allowed) {
    const seconds = retryAfter ?? 60
    const minutes = Math.max(1, Math.ceil(seconds / 60))

    return problemResponse(c, {
      status: 429,
      detail: `너무 많은 시도가 있었어요. ${minutes}분 후에 다시 시도해 주세요.`,
      headers: { 'Retry-After': String(seconds) },
    })
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

      await tx.delete(twoFactorTable).where(eq(twoFactorTable.userId, userId))

      return { kind: 'disabled' } as const
    })

    switch (result.kind) {
      case 'disabled':
        await Promise.allSettled([twoFactorDisableLimiter.reward(String(userId))])
        return c.json<DELETEV1MeTwoFactorResponse>({ message: '2단계 인증이 비활성화됐어요' })

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
