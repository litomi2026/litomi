import { zValidator } from '@hono/zod-validator'
import { and, eq, gt, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { POINT_CONSTANTS, TRANSACTION_TYPE } from '@/constants/points'
import { db } from '@/database/supabase/drizzle'
import { adImpressionTokenTable, pointTransactionTable, userPointsTable } from '@/database/supabase/points-schema'

const route = new Hono<Env>()

const requestSchema = z.object({
  token: z.string().length(64),
})

const errorResponses: Record<string, { error: string; status: number }> = {
  INVALID_TOKEN: { error: '유효하지 않은 토큰이에요', status: 400 },
  TOKEN_OWNER_MISMATCH: { error: '토큰 소유자가 일치하지 않아요', status: 403 },
  TOKEN_ALREADY_USED: { error: '이미 사용된 토큰이에요', status: 400 },
  TOKEN_EXPIRED: { error: '토큰이 만료됐어요', status: 400 },
  DAILY_LIMIT_REACHED: { error: '오늘의 적립 한도에 도달했어요', status: 429 },
}

route.post('/', zValidator('json', requestSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
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
        throw new Error('INVALID_TOKEN')
      }

      // 2. 토큰 소유자 검증
      if (tokenRecord.userId !== userId) {
        throw new Error('TOKEN_OWNER_MISMATCH')
      }

      // 3. 이미 사용된 토큰인지 확인
      if (tokenRecord.isUsed) {
        throw new Error('TOKEN_ALREADY_USED')
      }

      // 4. 토큰 만료 확인
      if (tokenRecord.expiresAt < now) {
        throw new Error('TOKEN_EXPIRED')
      }

      // 5. 일일 한도 재검증
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const todayTransactions = await tx
        .select({ amount: pointTransactionTable.amount })
        .from(pointTransactionTable)
        .where(
          and(
            eq(pointTransactionTable.userId, userId),
            eq(pointTransactionTable.type, TRANSACTION_TYPE.AD_CLICK),
            gt(pointTransactionTable.createdAt, todayStart),
          ),
        )

      const todayEarned = todayTransactions.reduce((sum, t) => sum + t.amount, 0)

      if (todayEarned >= POINT_CONSTANTS.DAILY_EARN_LIMIT) {
        throw new Error('DAILY_LIMIT_REACHED')
      }

      // 6. 토큰을 사용됨으로 표시
      await tx
        .update(adImpressionTokenTable)
        .set({
          isUsed: true,
          usedAt: now,
        })
        .where(eq(adImpressionTokenTable.id, tokenRecord.id))

      // 7. 포인트 적립
      const amount = POINT_CONSTANTS.AD_CLICK_REWARD

      const [existingPoints] = await tx
        .select()
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .for('update')

      let newBalance: number

      if (existingPoints) {
        newBalance = existingPoints.balance + amount
        await tx
          .update(userPointsTable)
          .set({
            balance: newBalance,
            totalEarned: sql`${userPointsTable.totalEarned} + ${amount}`,
            updatedAt: now,
          })
          .where(eq(userPointsTable.userId, userId))
      } else {
        newBalance = amount
        await tx.insert(userPointsTable).values({
          userId,
          balance: newBalance,
          totalEarned: amount,
          totalSpent: 0,
        })
      }

      // 8. 거래 내역 기록
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
        dailyRemaining: POINT_CONSTANTS.DAILY_EARN_LIMIT - todayEarned - amount,
      }
    })

    return c.json({
      success: true,
      balance: result.balance,
      earned: result.earned,
      dailyRemaining: result.dailyRemaining,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const response = errorResponses[message]

    if (response) {
      return c.json({ error: response.error, code: message }, response.status as 400 | 403 | 429)
    }

    return c.json({ error: '포인트 적립에 실패했어요' }, 500)
  }
})

export default route
