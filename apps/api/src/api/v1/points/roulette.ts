import { type POSTV1RouletteSpinResponse, PROBLEM, postV1RouletteSpinRequestSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { pointTransactionTable, userPointsTable } from '@litomi/db/app/points'
import { TRANSACTION_TYPE } from '@litomi/domain/points/model'
import { assertRouletteConfig, ROULETTE_CONFIG, type RouletteSegment } from '@litomi/domain/points/roulette'
import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

assertRouletteConfig(ROULETTE_CONFIG)

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('json', postV1RouletteSpinRequestSchema))

route.post('/spin', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { bet } = c.req.valid('json')

  try {
    const result = await db.transaction(async (tx) => {
      // user_points 레코드가 없을 수 있어서 먼저 생성해요.
      await tx.insert(userPointsTable).values({ userId }).onConflictDoNothing()

      const [points] = await tx
        .select({ balance: userPointsTable.balance })
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .for('update')

      if (!points || points.balance < bet) {
        return {
          ok: false as const,
          problem: PROBLEM.INSUFFICIENT_POINTS,
        }
      }

      // 1) 배팅 차감
      const balanceAfterBet = points.balance - bet

      await tx
        .update(userPointsTable)
        .set({
          balance: balanceAfterBet,
          totalSpent: sql`${userPointsTable.totalSpent} + ${bet}`,
        })
        .where(eq(userPointsTable.userId, userId))

      await tx.insert(pointTransactionTable).values({
        userId,
        type: TRANSACTION_TYPE.ROULETTE_BET,
        amount: -bet,
        balanceAfter: balanceAfterBet,
      })

      // 2) 결과 결정 (서버 RNG)
      const landed = pickRouletteSegment(ROULETTE_CONFIG.segments)
      const payout = Math.floor((bet * landed.payoutMultiplierX100) / 100)
      const balanceAfterPayout = balanceAfterBet + payout

      // 3) 지급 (0이면 지급/기록 생략)
      if (payout > 0) {
        await tx
          .update(userPointsTable)
          .set({
            balance: balanceAfterPayout,
            totalEarned: sql`${userPointsTable.totalEarned} + ${payout}`,
          })
          .where(eq(userPointsTable.userId, userId))

        await tx.insert(pointTransactionTable).values({
          userId,
          type: TRANSACTION_TYPE.ROULETTE_PAYOUT,
          amount: payout,
          balanceAfter: balanceAfterPayout,
        })
      }

      return {
        ok: true as const,
        balance: balanceAfterPayout,
        bet,
        payout,
        net: payout - bet,
        landed: {
          id: landed.id,
          label: landed.label,
          payoutMultiplierX100: landed.payoutMultiplierX100,
        },
      }
    })

    if (!result.ok) {
      return problemResponse(c, result)
    }

    return c.json({
      balance: result.balance,
      bet: result.bet,
      payout: result.payout,
      net: result.net,
      landed: result.landed,
    } satisfies POSTV1RouletteSpinResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route

function pickRouletteSegment(segments: RouletteSegment[]): RouletteSegment {
  const totalWeight = segments.reduce((acc, s) => acc + s.weight, 0)
  if (totalWeight <= 0) {
    // Should be impossible due to assertRouletteConfig, but keep safe fallback.
    return segments[0]
  }

  const ticket = randomInt(totalWeight) // 0..totalWeight-1
  let acc = 0
  for (const s of segments) {
    acc += s.weight
    if (ticket < acc) {
      return s
    }
  }

  return segments[segments.length - 1]
}

/**
 * Uniform int in [0, upperExclusive).
 * Uses rejection sampling to avoid modulo bias.
 */
function randomInt(upperExclusive: number): number {
  if (!Number.isSafeInteger(upperExclusive) || upperExclusive <= 0) {
    throw new Error('Invalid upperExclusive')
  }

  // 2^32
  const range = 0x1_0000_0000
  const limit = Math.floor(range / upperExclusive) * upperExclusive
  const buf = new Uint32Array(1)

  while (true) {
    crypto.getRandomValues(buf)
    const x = buf[0]!
    if (x < limit) {
      return x % upperExclusive
    }
  }
}
