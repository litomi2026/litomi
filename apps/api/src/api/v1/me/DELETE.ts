import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { type DELETEV1MeResponse, deleteV1MeBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { twoFactorTable } from '@litomi/db/app/two-factor'
import { userTable } from '@litomi/db/app/user'
import { compare } from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { applyAuthCookie } from '@/utils/cookie'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { authRequiredProblemResponse, problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { RedisRateLimiter, RedisRateLimitPresets } from '@/utils/rate-limit'
import { zProblemValidator } from '@/utils/validator'

const accountDeletionLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'me-delete:user',
})

const route = new Hono<Env>()

route.delete('/', zProblemValidator('json', deleteV1MeBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { password, token } = c.req.valid('json')
  const { allowed, retryAfter } = await accountDeletionLimiter.check(String(userId))

  if (!allowed) {
    return tooManyRequestsProblemResponse(c, retryAfter)
  }

  try {
    const result = await db.transaction(async (tx) => {
      await lockUserRowForUpdate(tx, userId)

      const [user] = await tx
        .select({
          loginId: userTable.loginId,
          passwordHash: userTable.passwordHash,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))

      if (!user) {
        return { kind: 'unauthorized' } as const
      }

      const isValidPassword = await compare(password, user.passwordHash).catch(() => false)

      if (!isValidPassword) {
        return { kind: 'verification-failed' } as const
      }

      const [twoFactor] = await tx
        .select({ secret: twoFactorTable.secret })
        .from(twoFactorTable)
        .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

      if (twoFactor) {
        if (!token) {
          return { kind: 'verification-failed' } as const
        }

        const secret = decryptTOTPSecret(twoFactor.secret)
        const isValidToken = await verifyTOTPToken(token, secret)

        if (!isValidToken) {
          return { kind: 'verification-failed' } as const
        }
      }

      await tx.delete(userTable).where(eq(userTable.id, userId))

      return {
        kind: 'deleted',
        loginId: user.loginId,
      } as const
    })

    switch (result.kind) {
      case 'deleted':
        applyAuthCookie(c, getAuthCookieClearConfigs())

        return c.json({
          loginId: result.loginId,
          message: `${result.loginId} 계정을 삭제했어요`,
        } satisfies DELETEV1MeResponse)

      case 'unauthorized':
        applyAuthCookie(c, getAuthCookieClearConfigs())
        return authRequiredProblemResponse(c)

      case 'verification-failed':
        return problemResponse(c, { status: 400 })
    }
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '계정을 삭제하지 못했어요' })
  }
})

export default route
