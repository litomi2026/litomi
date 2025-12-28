import { zValidator } from '@hono/zod-validator'
import { and, eq, gt, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import ms from 'ms'
import { z } from 'zod'

import { Env } from '@/backend'
import { POINT_CONSTANTS, TRANSACTION_TYPE } from '@/constants/points'
import { db } from '@/database/supabase/drizzle'
import { adImpressionTokenTable, pointTransactionTable, userPointsTable } from '@/database/supabase/points'

export type POSTV1PointEarnResponse = {
  success: true
  balance: number
  earned: number
  dailyRemaining: number
}

const route = new Hono<Env>()
const SECOND_MS = ms('1 second')

const requestSchema = z.object({
  token: z.string().length(64),
})

route.post('/', zValidator('json', requestSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    throw new HTTPException(401)
  }

  const { token } = c.req.valid('json')
  const now = new Date()

  try {
    const result = await db.transaction(async (tx) => {
      // 1. 토큰 검증 (FOR UPDATE로 락)
      const [tokenRecord] = await tx
        .select()
        .from(adImpressionTokenTable)
        .where(eq(adImpressionTokenTable.token, token))
        .for('update')

      if (!tokenRecord) {
        throw new HTTPException(400, { message: '유효하지 않은 토큰이에요' })
      }

      // 2. 토큰 소유자 검증
      if (tokenRecord.userId !== userId) {
        throw new HTTPException(403, { message: '토큰 소유자가 일치하지 않아요' })
      }

      // 3. 토큰 만료 확인
      if (tokenRecord.expiresAt < now) {
        throw new HTTPException(400, { message: '토큰이 만료됐어요' })
      }

      // 5. 유저 포인트 레코드 락(없으면 생성)
      await tx.insert(userPointsTable).values({ userId }).onConflictDoNothing()

      const [points] = await tx
        .select({ balance: userPointsTable.balance })
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .for('update')

      if (!points) {
        throw new HTTPException(500, { message: '포인트 적립에 실패했어요' })
      }

      // 6. 일일 한도 재검증 (하루 최대 10번)
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
        throw new HTTPException(429, { message: '오늘의 적립 한도에 도달했어요' })
      }

      // 7. 같은 광고 쿨다운 체크 (1분)
      if (tokenRecord.lastEarnedAt) {
        const adSlotCooldownTime = new Date(now.getTime() - POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS)

        if (tokenRecord.lastEarnedAt > adSlotCooldownTime) {
          const remainingMs = POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS - (now.getTime() - tokenRecord.lastEarnedAt.getTime())
          const remainingSeconds = Math.max(1, Math.ceil(remainingMs / SECOND_MS))
          throw new HTTPException(429, {
            res: c.text('같은 광고는 잠시 후 다시 적립할 수 있어요', 429, { 'Retry-After': String(remainingSeconds) }),
          })
        }
      }

      // 8. 토큰 로테이션 + 마지막 적립 시간 기록
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

      // 9. 포인트 적립
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

      // 10. 거래 내역 기록
      await tx.insert(pointTransactionTable).values({
        userId,
        type: TRANSACTION_TYPE.AD_CLICK,
        amount,
        balanceAfter: newBalance,
        description: `광고 클릭 (${tokenRecord.adSlotId})`,
      })

      return {
        balance: newBalance,
        earned: amount,
        dailyRemaining: (POINT_CONSTANTS.DAILY_EARN_LIMIT_COUNT - todayEarnCount - 1) * POINT_CONSTANTS.AD_CLICK_REWARD,
      }
    })

    return c.json<POSTV1PointEarnResponse>({
      success: true,
      balance: result.balance,
      earned: result.earned,
      dailyRemaining: result.dailyRemaining,
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }

    throw new HTTPException(500, { message: '포인트 적립에 실패했어요' })
  }
})

export default route

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
