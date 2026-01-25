import { and, eq, gt, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { COOKIE_DOMAIN } from '@/constants'
import { POINT_CONSTANTS, TRANSACTION_TYPE } from '@/constants/points'
import { CookieKey } from '@/constants/storage'
import { db } from '@/database/supabase/drizzle'
import { adImpressionTokenTable, pointTransactionTable, userPointsTable } from '@/database/supabase/points'

import { verifyPointsTurnstileToken } from './util-turnstile-cookie'

export type POSTV1PointEarnResponse = {
  balance: number
  earned: number
  dailyRemaining: number
}

type TransactionResult =
  | { ok: false; status: number; detail?: string; headers?: Record<string, string> }
  | { ok: true; balance: number; earned: number; dailyRemaining: number }

const route = new Hono<Env>()

const requestSchema = z.object({
  token: z.string().length(64),
})

route.post('/', requireAuth, zProblemValidator('json', requestSchema), async (c) => {
  const userId = c.get('userId')!

  const turnstileCookie = getCookie(c, CookieKey.POINTS_TURNSTILE)

  if (!turnstileCookie) {
    return problemResponse(c, {
      status: 403,
      code: 'turnstile-required',
      detail: '보안 검증을 완료해 주세요',
    })
  }

  const verified = await verifyPointsTurnstileToken(turnstileCookie)

  if (!verified || verified.userId !== userId) {
    deleteCookie(c, CookieKey.POINTS_TURNSTILE, { domain: COOKIE_DOMAIN, path: '/api/v1/points' })
    return problemResponse(c, {
      status: 403,
      code: 'turnstile-required',
      detail: '보안 검증을 완료해 주세요',
    })
  }

  const { token } = c.req.valid('json')
  const now = new Date()

  try {
    const result: TransactionResult = await db.transaction(async (tx) => {
      // 1. 토큰 검증 (FOR UPDATE로 락)
      const [tokenRecord] = await tx
        .select()
        .from(adImpressionTokenTable)
        .where(eq(adImpressionTokenTable.token, token))
        .for('update')

      if (!tokenRecord) {
        return { ok: false, status: 400, detail: '유효하지 않은 토큰이에요' }
      }

      // 2. 토큰 소유자 검증
      if (tokenRecord.userId !== userId) {
        return { ok: false, status: 403, detail: '토큰 소유자가 일치하지 않아요' }
      }

      // 3. 토큰 만료 확인
      if (tokenRecord.expiresAt < now) {
        return { ok: false, status: 400, detail: '토큰이 만료됐어요' }
      }

      // 4. 일일 한도 재검증 (하루 최대 10번)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const todayTransactions = await tx
        .select({ id: pointTransactionTable.id })
        .from(pointTransactionTable)
        .where(
          and(
            eq(pointTransactionTable.userId, userId),
            eq(pointTransactionTable.type, TRANSACTION_TYPE.AD_CLICK),
            gt(pointTransactionTable.createdAt, todayStart),
          ),
        )
        .limit(POINT_CONSTANTS.DAILY_EARN_LIMIT_COUNT)

      const todayEarnCount = todayTransactions.length

      if (todayEarnCount >= POINT_CONSTANTS.DAILY_EARN_LIMIT_COUNT) {
        return { ok: false, status: 429, detail: '오늘의 적립 한도에 도달했어요' }
      }

      // 5. 같은 광고 쿨다운 체크 (1분)
      if (tokenRecord.lastEarnedAt) {
        const adSlotCooldownTime = new Date(now.getTime() - POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS)

        if (tokenRecord.lastEarnedAt > adSlotCooldownTime) {
          const remainingMs = POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS - (now.getTime() - tokenRecord.lastEarnedAt.getTime())
          const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000))

          return {
            ok: false,
            status: 429,
            detail: '같은 광고는 잠시 후 다시 적립할 수 있어요',
            headers: { 'Retry-After': String(remainingSeconds) },
          }
        }
      }

      // 6. 유저 포인트 레코드 락(없으면 생성)
      await tx.insert(userPointsTable).values({ userId }).onConflictDoNothing()

      const [points] = await tx
        .select({ balance: userPointsTable.balance })
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .for('update')

      if (!points) {
        throw new Error('User points record is missing after upsert')
      }

      // 7. 토큰 로테이션 + 마지막 적립 시간 기록
      const rotatedToken = generateToken()
      const rotatedTokenExpiresAt = new Date(now.getTime() + POINT_CONSTANTS.TOKEN_EXPIRY_MS)
      await tx
        .update(adImpressionTokenTable)
        .set({
          token: rotatedToken,
          expiresAt: rotatedTokenExpiresAt,
          lastEarnedAt: now,
        })
        .where(eq(adImpressionTokenTable.id, tokenRecord.id))

      // 8. 포인트 적립
      const amount = POINT_CONSTANTS.AD_CLICK_REWARD
      const newBalance = points.balance + amount
      await tx
        .update(userPointsTable)
        .set({
          balance: newBalance,
          totalEarned: sql`${userPointsTable.totalEarned} + ${amount}`,
          updatedAt: now,
        })
        .where(eq(userPointsTable.userId, userId))

      // 9. 거래 내역 기록
      await tx.insert(pointTransactionTable).values({
        userId,
        type: TRANSACTION_TYPE.AD_CLICK,
        amount,
        balanceAfter: newBalance,
      })

      return {
        ok: true,
        balance: newBalance,
        earned: amount,
        dailyRemaining: (POINT_CONSTANTS.DAILY_EARN_LIMIT_COUNT - todayEarnCount - 1) * POINT_CONSTANTS.AD_CLICK_REWARD,
      }
    })

    if (!result.ok) {
      return problemResponse(c, {
        status: result.status,
        detail: result.detail,
        headers: result.headers,
      })
    }

    return c.json<POSTV1PointEarnResponse>({
      balance: result.balance,
      earned: result.earned,
      dailyRemaining: result.dailyRemaining,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '포인트 적립에 실패했어요' })
  }
})

export default route

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
