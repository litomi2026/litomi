import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { db } from '@/database/supabase/drizzle'
import { userPointsTable } from '@/database/supabase/points'

export type GETV1PointsResponse = {
  balance: number
  totalEarned: number
  totalSpent: number
}

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
