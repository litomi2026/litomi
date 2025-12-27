import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

import { Env } from '@/backend'
import { POINT_CONSTANTS, TRANSACTION_TYPE } from '@/constants/points'
import { db } from '@/database/supabase/drizzle'
import { adImpressionTokenTable, pointTransactionTable, userPointsTable } from '@/database/supabase/points'

const route = new Hono<Env>()

const requestSchema = z.object({
  token: z.string().length(64),
})

const errorResponses: Record<string, { error: string; status: 400 | 403 | 429 }> = {
  INVALID_TOKEN: { error: '유효하지 않은 토큰이에요', status: 400 },
  TOKEN_OWNER_MISMATCH: { error: '토큰 소유자가 일치하지 않아요', status: 403 },
  TOKEN_ALREADY_USED: { error: '이미 사용된 토큰이에요', status: 400 },
  TOKEN_EXPIRED: { error: '토큰이 만료됐어요', status: 400 },
  DAILY_LIMIT_REACHED: { error: '오늘의 적립 한도에 도달했어요', status: 429 },
  AD_SLOT_COOLDOWN: { error: '같은 광고는 잠시 후 다시 적립할 수 있어요', status: 429 },
}

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

      // 5. 유저 포인트 레코드 락(없으면 생성)
      await tx.insert(userPointsTable).values({ userId }).onConflictDoNothing()

      const [points] = await tx
        .select({ balance: userPointsTable.balance })
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .for('update')

      if (!points) {
        throw new Error('POINTS_NOT_FOUND')
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
        throw new Error('DAILY_LIMIT_REACHED')
      }

      // 7. 같은 광고 쿨다운 체크 (1분)
      const adSlotCooldownTime = new Date(now.getTime() - POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS)
      const [lastAdSlotEarn] = await tx
        .select({ usedAt: adImpressionTokenTable.usedAt })
        .from(adImpressionTokenTable)
        .where(
          and(
            eq(adImpressionTokenTable.userId, userId),
            eq(adImpressionTokenTable.adSlotId, tokenRecord.adSlotId),
            eq(adImpressionTokenTable.isUsed, true),
            gt(adImpressionTokenTable.usedAt, adSlotCooldownTime),
          ),
        )
        .orderBy(desc(adImpressionTokenTable.usedAt))
        .limit(1)

      if (lastAdSlotEarn?.usedAt) {
        const remainingMs = POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS - (now.getTime() - lastAdSlotEarn.usedAt.getTime())
        const error = Object.assign(new Error('AD_SLOT_COOLDOWN'), {
          remainingSeconds: Math.ceil(remainingMs / 1000),
        })
        throw error
      }

      // 8. 토큰을 사용됨으로 표시
      await tx
        .update(adImpressionTokenTable)
        .set({
          isUsed: true,
          usedAt: now,
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
      const remainingSeconds =
        typeof error === 'object' &&
        error !== null &&
        'remainingSeconds' in error &&
        typeof (error as { remainingSeconds: unknown }).remainingSeconds === 'number'
          ? (error as { remainingSeconds: number }).remainingSeconds
          : undefined

      if (remainingSeconds != null) {
        throw new HTTPException(response.status, {
          res: c.text(response.error, response.status, { 'Retry-After': String(remainingSeconds) }),
        })
      }

      throw new HTTPException(response.status, { message: response.error })
    }

    throw new HTTPException(500, { message: '포인트 적립에 실패했어요' })
  }
})

export default route
