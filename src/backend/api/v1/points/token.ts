import { and, eq, gt, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import ms from 'ms'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { POINT_CONSTANTS, TRANSACTION_TYPE } from '@/constants/points'
import { db } from '@/database/supabase/drizzle'
import { adImpressionTokenTable, pointTransactionTable } from '@/database/supabase/points'

export type POSTV1PointTokenResponse = {
  token: string
  expiresAt: string
  dailyRemaining: number
}

const route = new Hono<Env>()
const SECOND_MS = ms('1 second')

const requestSchema = z.object({
  adSlotId: z.string().min(1).max(50),
})

route.post('/', zProblemValidator('json', requestSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  try {
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
      const tomorrowStart = new Date(todayStart)
      tomorrowStart.setDate(tomorrowStart.getDate() + 1)
      const remainingMs = Math.max(0, tomorrowStart.getTime() - now.getTime())
      const remainingSeconds = Math.max(1, Math.ceil(remainingMs / SECOND_MS))

      return problemResponse(c, {
        status: 429,
        detail: '오늘의 적립 한도에 도달했어요',
        headers: { 'Retry-After': String(remainingSeconds) },
      })
    }

    const expiresAt = new Date(now.getTime() + POINT_CONSTANTS.TOKEN_EXPIRY_MS)
    const adSlotCooldownTime = new Date(now.getTime() - POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS)
    const newToken = generateToken()
    const nowIso = now.toISOString()
    const expiresAtIso = expiresAt.toISOString()
    const adSlotCooldownTimeIso = adSlotCooldownTime.toISOString()

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
        set: {
          token: sql`CASE
              WHEN ${adImpressionTokenTable.lastEarnedAt} IS NOT NULL AND ${adImpressionTokenTable.lastEarnedAt} > ${adSlotCooldownTimeIso}
                THEN ${adImpressionTokenTable.token}
              WHEN ${adImpressionTokenTable.expiresAt} < ${nowIso}
                THEN ${sql.raw(`excluded.${adImpressionTokenTable.token.name}`)}
              ELSE ${adImpressionTokenTable.token}
            END`,
          expiresAt: sql`CASE
              WHEN ${adImpressionTokenTable.lastEarnedAt} IS NOT NULL AND ${adImpressionTokenTable.lastEarnedAt} > ${adSlotCooldownTimeIso}
                THEN ${adImpressionTokenTable.expiresAt}
              ELSE ${expiresAtIso}
            END`,
        },
      })
      .returning({
        token: adImpressionTokenTable.token,
        expiresAt: adImpressionTokenTable.expiresAt,
        lastEarnedAt: adImpressionTokenTable.lastEarnedAt,
      })

    if (!result) {
      return problemResponse(c, { status: 500, detail: '토큰 생성에 실패했어요' })
    }

    if (result.lastEarnedAt && result.lastEarnedAt > adSlotCooldownTime) {
      const remainingMs = POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS - (now.getTime() - result.lastEarnedAt.getTime())
      const remainingSeconds = Math.max(1, Math.ceil(remainingMs / SECOND_MS))

      return problemResponse(c, {
        status: 429,
        detail: '같은 광고는 잠시 후 다시 적립할 수 있어요',
        headers: { 'Retry-After': String(remainingSeconds) },
      })
    }

    return c.json<POSTV1PointTokenResponse>({
      token: result.token,
      expiresAt: result.expiresAt.toISOString(),
      dailyRemaining: (POINT_CONSTANTS.DAILY_EARN_LIMIT_COUNT - todayEarnCount) * POINT_CONSTANTS.AD_CLICK_REWARD,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '토큰 생성에 실패했어요' })
  }
})

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export default route
