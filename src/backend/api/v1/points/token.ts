import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, gt } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

import { Env } from '@/backend'
import { POINT_CONSTANTS, TRANSACTION_TYPE } from '@/constants/points'
import { db } from '@/database/supabase/drizzle'
import { adImpressionTokenTable, pointTransactionTable } from '@/database/supabase/points'

export type POSTV1PointTokenResponse = {
  token: string
  expiresAt: string
  dailyRemaining: number
}

const route = new Hono<Env>()

const requestSchema = z.object({
  adSlotId: z.string().min(1).max(50),
})

route.post('/', zValidator('json', requestSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    throw new HTTPException(401)
  }

  const { adSlotId } = c.req.valid('json')
  const now = new Date()

  // 1. 일일 적립 한도 체크
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayTransactions = await db
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

  // 2. 광고 슬롯 쿨다운 체크 (같은 광고 1분)
  const adSlotCooldownTime = new Date(now.getTime() - POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS)

  const [lastAdSlotToken] = await db
    .select({ usedAt: adImpressionTokenTable.usedAt })
    .from(adImpressionTokenTable)
    .where(
      and(
        eq(adImpressionTokenTable.userId, userId),
        eq(adImpressionTokenTable.adSlotId, adSlotId),
        eq(adImpressionTokenTable.isUsed, true),
        gt(adImpressionTokenTable.usedAt, adSlotCooldownTime),
      ),
    )
    .orderBy(desc(adImpressionTokenTable.usedAt))
    .limit(1)

  if (lastAdSlotToken?.usedAt) {
    const remainingMs = POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS - (now.getTime() - lastAdSlotToken.usedAt.getTime())
    const remainingSeconds = Math.ceil(remainingMs / 1000)
    throw new HTTPException(429, {
      res: c.text('같은 광고는 잠시 후 다시 적립할 수 있어요', 429, { 'Retry-After': String(remainingSeconds) }),
    })
  }

  // 3. 토큰 생성 또는 기존 토큰 반환 (INSERT ... ON CONFLICT DO UPDATE RETURNING)
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
    throw new HTTPException(500, { message: '토큰 생성에 실패했어요' })
  }

  return c.json<POSTV1PointTokenResponse>({
    token: result.token,
    expiresAt: result.expiresAt.toISOString(),
    dailyRemaining: (POINT_CONSTANTS.DAILY_EARN_LIMIT_COUNT - todayEarnCount) * POINT_CONSTANTS.AD_CLICK_REWARD,
  })
})

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export default route
