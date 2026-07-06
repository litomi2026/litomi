import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { revokeBillingKey } from '@litomi/billing'
import { type DELETEV1MeResponse, deleteV1MeBodySchema, PROBLEM } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { chatArtistTable } from '@litomi/db/app/chat'
import { invoiceTable } from '@litomi/db/app/invoice'
import { paymentMethodTable, subscriptionTable } from '@litomi/db/app/subscription'
import { twoFactorTable } from '@litomi/db/app/two-factor'
import { userErasureTable, userTable } from '@litomi/db/app/user'
import { SUBSCRIPTION_TARGET_CHAT_ARTIST } from '@litomi/domain/subscription/policy'
import { compare } from 'bcryptjs'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

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
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', deleteV1MeBodySchema))

route.delete('/', ...middlewares, async (c) => {
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

      // 아티스트였다면 판매된 콘텐츠(브로드캐스트·1:1 되답장)를 보존하기 위해 오퍼링만 종료한다.
      const [chatArtist] = await tx
        .update(chatArtistTable)
        .set({ isActive: false })
        .where(eq(chatArtistTable.userId, userId))
        .returning({ id: chatArtistTable.id })

      if (chatArtist) {
        // 아티스트 이탈 = 오퍼링 영구 종료 → 구독 팬을 즉시 clean terminal로 전이한다. 결제 실패가
        // 아니므로 canceled(워커의 past_due 표류 차단), expiresAt는 유지해 남은 유료기간은 보존된
        // 브로드캐스트로 존중한다(무환불).
        await tx
          .update(subscriptionTable)
          .set({
            autoRenew: false,
            status: 'canceled',
            canceledAt: new Date(),
          })
          .where(
            and(
              eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
              eq(subscriptionTable.targetId, chatArtist.id),
              inArray(subscriptionTable.status, ['incomplete', 'active', 'past_due']),
            ),
          )

        // 진행 중이던 미결제(open) 청구 슬롯을 비워 갱신이 완주하지 못하게 한다.
        await tx
          .update(invoiceTable)
          .set({ status: 'void' })
          .where(
            and(
              eq(invoiceTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
              eq(invoiceTable.targetId, chatArtist.id),
              eq(invoiceTable.status, 'open'),
            ),
          )
      }

      // Chat DB(별도 클러스터)는 cascade가 닿지 않으므로 파기 outbox를 남긴다.
      await tx.insert(userErasureTable).values({ userId })

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
        return problemResponse(c, { problem: PROBLEM.CREDENTIAL_VERIFICATION_FAILED })
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
