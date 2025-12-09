import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, gt } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { POINT_CONSTANTS, TRANSACTION_TYPE } from '@/constants/points'
import { db } from '@/database/supabase/drizzle'
import { adImpressionTokenTable, pointTransactionTable } from '@/database/supabase/points-schema'

const route = new Hono<Env>()

const requestSchema = z.object({
  adSlotId: z.string().min(1).max(50),
})

route.post('/', zValidator('json', requestSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { adSlotId } = c.req.valid('json')
  const now = new Date()

  // 1. 일일 적립 한도 체크
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayTransactions = await db
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
    return c.json({ error: '오늘의 적립 한도에 도달했어요', code: 'DAILY_LIMIT_REACHED' }, 429)
  }

  // 2. 유저 쿨다운 체크 (마지막 적립으로부터 1분)
  const userCooldownTime = new Date(now.getTime() - POINT_CONSTANTS.USER_COOLDOWN_MS)

  const [lastUserEarn] = await db
    .select({ createdAt: pointTransactionTable.createdAt })
    .from(pointTransactionTable)
    .where(
      and(
        eq(pointTransactionTable.userId, userId),
        eq(pointTransactionTable.type, TRANSACTION_TYPE.AD_CLICK),
        gt(pointTransactionTable.createdAt, userCooldownTime),
      ),
    )
    .orderBy(desc(pointTransactionTable.createdAt))
    .limit(1)

  if (lastUserEarn) {
    const remainingMs = POINT_CONSTANTS.USER_COOLDOWN_MS - (now.getTime() - lastUserEarn.createdAt.getTime())
    return c.json(
      {
        error: '잠시 후 다시 시도해 주세요',
        code: 'USER_COOLDOWN',
        remainingSeconds: Math.ceil(remainingMs / 1000),
      },
      429,
    )
  }

  // 3. 광고 슬롯 쿨다운 체크 (같은 광고 5분)
  const adSlotCooldownTime = new Date(now.getTime() - POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS)

  const [lastAdSlotToken] = await db
    .select({ createdAt: adImpressionTokenTable.createdAt })
    .from(adImpressionTokenTable)
    .where(
      and(
        eq(adImpressionTokenTable.userId, userId),
        eq(adImpressionTokenTable.adSlotId, adSlotId),
        eq(adImpressionTokenTable.isUsed, true),
        gt(adImpressionTokenTable.createdAt, adSlotCooldownTime),
      ),
    )
    .orderBy(desc(adImpressionTokenTable.createdAt))
    .limit(1)

  if (lastAdSlotToken) {
    const remainingMs = POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS - (now.getTime() - lastAdSlotToken.createdAt.getTime())
    return c.json(
      {
        error: '같은 광고는 잠시 후 다시 클릭할 수 있어요',
        code: 'AD_SLOT_COOLDOWN',
        remainingSeconds: Math.ceil(remainingMs / 1000),
      },
      429,
    )
  }

  // 4. 토큰 생성 또는 기존 토큰 반환 (INSERT ... ON CONFLICT DO UPDATE RETURNING)
  const newToken = generateToken()
  const expiresAt = new Date(now.getTime() + POINT_CONSTANTS.TOKEN_EXPIRY_MS)

  const [result] = await db
    .insert(adImpressionTokenTable)
    .values({
      userId,
      token: newToken,
      adSlotId,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [adImpressionTokenTable.userId, adImpressionTokenTable.adSlotId],
      targetWhere: eq(adImpressionTokenTable.isUsed, false),
      set: { expiresAt },
    })
    .returning({
      token: adImpressionTokenTable.token,
      expiresAt: adImpressionTokenTable.expiresAt,
    })

  if (!result) {
    return c.json({ error: '토큰 생성에 실패했어요', code: 'TOKEN_CREATE_FAILED' }, 500)
  }

  return c.json({
    token: result.token,
    expiresAt: result.expiresAt.toISOString(),
    dailyRemaining: POINT_CONSTANTS.DAILY_EARN_LIMIT - todayEarned,
  })
})

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export default route
