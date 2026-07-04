import { type POSTV1PointTokenResponse, PROBLEM, postV1PointTokenRequestSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { adImpressionTokenTable, pointTransactionTable } from '@litomi/db/app/points'
import { POINT_CONSTANTS, TRANSACTION_TYPE } from '@litomi/domain/points/model'
import { CookieKey } from '@litomi/http/cookie'
import { and, eq, gt, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { verifyPointsTurnstileToken } from './util-turnstile-cookie'

const route = new Hono<Env>()

route.post('/', requireAuth, zProblemValidator('json', postV1PointTokenRequestSchema), async (c) => {
  const userId = c.get('userId')!

  const turnstileCookie = getCookie(c, CookieKey.POINTS_TURNSTILE)

  if (!turnstileCookie) {
    return problemResponse(c, { problem: PROBLEM.TURNSTILE_REQUIRED })
  }

  const verified = await verifyPointsTurnstileToken(turnstileCookie)

  if (!verified || verified.userId !== userId) {
    deleteCookie(c, CookieKey.POINTS_TURNSTILE, { path: '/api/v1/points', secure: true })
    return problemResponse(c, { problem: PROBLEM.TURNSTILE_REQUIRED })
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
      const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000))

      return problemResponse(c, {
        problem: PROBLEM.DAILY_EARN_LIMIT_REACHED,
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
                THEN ${sql`excluded.${sql.identifier(adImpressionTokenTable.token.name)}`}
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
      return problemResponse(c, { status: 500 })
    }

    if (result.lastEarnedAt && result.lastEarnedAt > adSlotCooldownTime) {
      const remainingMs = POINT_CONSTANTS.AD_SLOT_COOLDOWN_MS - (now.getTime() - result.lastEarnedAt.getTime())
      const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000))

      return problemResponse(c, {
        problem: PROBLEM.AD_COOLDOWN,
        headers: { 'Retry-After': String(remainingSeconds) },
      })
    }

    return c.json({
      token: result.token,
      expiresAt: result.expiresAt.toISOString(),
      dailyRemaining: (POINT_CONSTANTS.DAILY_EARN_LIMIT_COUNT - todayEarnCount) * POINT_CONSTANTS.AD_CLICK_REWARD,
    } satisfies POSTV1PointTokenResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export default route
