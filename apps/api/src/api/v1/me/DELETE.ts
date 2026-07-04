import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { revokeBillingKey } from '@litomi/billing'
import { type DELETEV1MeResponse, deleteV1MeBodySchema, problemCode } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { chatArtistTable } from '@litomi/db/app/chat'
import { paymentMethodTable } from '@litomi/db/app/subscription'
import { twoFactorTable } from '@litomi/db/app/two-factor'
import { userErasureTable, userTable } from '@litomi/db/app/user'
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

      const billingTokens = await tx
        .select({ token: paymentMethodTable.token })
        .from(paymentMethodTable)
        .where(and(eq(paymentMethodTable.userId, userId), eq(paymentMethodTable.status, 'active')))

      // 아티스트였다면 판매된 메시지를 보존하기 위해 아티스트 계정의 운영만 종료시킨다.
      const [chatArtist] = await tx
        .update(chatArtistTable)
        .set({ isActive: false })
        .where(eq(chatArtistTable.userId, userId))
        .returning({ id: chatArtistTable.id })

      // Chat DB(별도 클러스터)는 cascade가 닿지 않으므로 파기 outbox를 남긴다.
      await tx.insert(userErasureTable).values({ userId, chatArtistId: chatArtist?.id ?? null })

      await tx.delete(userTable).where(eq(userTable.id, userId))

      return {
        kind: 'deleted',
        loginId: user.loginId,
        billingTokens: billingTokens.map((row) => row.token),
      } as const
    })

    switch (result.kind) {
      case 'deleted':
        await revokeBillingKeys(result.billingTokens)
        applyAuthCookie(c, getAuthCookieClearConfigs())
        return c.json({ loginId: result.loginId } satisfies DELETEV1MeResponse)

      case 'unauthorized':
        applyAuthCookie(c, getAuthCookieClearConfigs())
        return authRequiredProblemResponse(c)

      case 'verification-failed':
        return problemResponse(c, {
          status: 400,
          code: problemCode.CREDENTIAL_VERIFICATION_FAILED,
        })
    }
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

async function revokeBillingKeys(tokens: string[]): Promise<void> {
  const results = await Promise.allSettled(tokens.map((token) => revokeBillingKey(token)))

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('me delete: revokeBillingKey failed', result.reason)
    }
  }
}

export default route
