import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { TRANSACTION_TYPE } from '@/constants/points'
import { assertRouletteConfig, ROULETTE_CONFIG, type RouletteSegment } from '@/constants/roulette'
import { db } from '@/database/supabase/drizzle'
import { pointTransactionTable, userPointsTable } from '@/database/supabase/points'

assertRouletteConfig(ROULETTE_CONFIG)

export type POSTV1RouletteSpinRequest = {
  bet: number
}

export type POSTV1RouletteSpinResponse = {
  balance: number
  bet: number
  payout: number
  net: number
  landed: {
    id: RouletteSegment['id']
    label: string
    payoutMultiplierX100: number
  }
}

const route = new Hono<Env>()

const requestSchema = z.object({
  bet: z.coerce.number().int().positive(),
})

route.post('/spin', requireAuth, zProblemValidator('json', requestSchema), async (c) => {
  const userId = c.get('userId')!
  const { bet } = c.req.valid('json')

  if (bet < ROULETTE_CONFIG.minBet) {
    return problemResponse(c, { status: 400, detail: `최소 배팅은 ${ROULETTE_CONFIG.minBet.toLocaleString()} 리보예요` })
  }
  if (bet > ROULETTE_CONFIG.maxBet) {
    return problemResponse(c, { status: 400, detail: `최대 배팅은 ${ROULETTE_CONFIG.maxBet.toLocaleString()} 리보예요` })
  }

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
        return { ok: false as const, status: 400 as const, detail: '리보가 부족해요' }
      }

      // 1) 배팅 차감
      const balanceAfterBet = points.balance - bet
      await tx
        .update(userPointsTable)
        .set({
          balance: balanceAfterBet,
          totalSpent: sql`${userPointsTable.totalSpent} + ${bet}`,
          updatedAt: new Date(),
        })
        .where(eq(userPointsTable.userId, userId))

      await tx.insert(pointTransactionTable).values({
        userId,
        type: TRANSACTION_TYPE.ROULETTE_BET,
        amount: -bet,
        balanceAfter: balanceAfterBet,
        description: `룰렛 배팅 (-${bet.toLocaleString()} 리보)`,
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
            updatedAt: new Date(),
          })
          .where(eq(userPointsTable.userId, userId))

        await tx.insert(pointTransactionTable).values({
          userId,
          type: TRANSACTION_TYPE.ROULETTE_PAYOUT,
          amount: payout,
          balanceAfter: balanceAfterPayout,
          description: `룰렛 당첨 (+${payout.toLocaleString()} 리보)`,
        })
      }

      return {
        ok: true as const,
        balance: balanceAfterPayout,
        bet,
        payout,
        net: payout - bet,
        landed: { id: landed.id, label: landed.label, payoutMultiplierX100: landed.payoutMultiplierX100 },
      }
    })

    if (!result.ok) {
      return problemResponse(c, { status: result.status, detail: result.detail })
    }

    return c.json<POSTV1RouletteSpinResponse>({
      balance: result.balance,
      bet: result.bet,
      payout: result.payout,
      net: result.net,
      landed: result.landed,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '룰렛에 실패했어요' })
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

