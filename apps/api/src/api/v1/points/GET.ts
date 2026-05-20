import type { GETV1PointsResponse } from '@litomi/contracts'

import { db } from '@litomi/db/app'
import { userPointsTable } from '@litomi/db/app/points'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()

route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  try {
    const [points] = await db
      .select({
        balance: userPointsTable.balance,
        totalEarned: userPointsTable.totalEarned,
        totalSpent: userPointsTable.totalSpent,
      })
      .from(userPointsTable)
      .where(eq(userPointsTable.userId, userId))

    if (!points) {
      const response = {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      }

      return c.json<GETV1PointsResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
    }

    const response = {
      balance: points.balance,
      totalEarned: points.totalEarned,
      totalSpent: points.totalSpent,
    }

    return c.json<GETV1PointsResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '포인트 조회에 실패했어요' })
  }
})

export default route
