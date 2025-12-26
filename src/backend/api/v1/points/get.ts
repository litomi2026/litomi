import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { Env } from '@/backend'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { userPointsTable } from '@/database/supabase/points-schema'

export type GETV1PointsResponse = {
  balance: number
  totalEarned: number
  totalSpent: number
}

const route = new Hono<Env>()

route.get('/', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [points] = await db
    .select({
      balance: userPointsTable.balance,
      totalEarned: userPointsTable.totalEarned,
      totalSpent: userPointsTable.totalSpent,
    })
    .from(userPointsTable)
    .where(eq(userPointsTable.userId, userId))

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 3,
  })

  if (!points) {
    const response = {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    }

    return c.json<GETV1PointsResponse>(response, { headers: { 'Cache-Control': cacheControl } })
  }

  const response = {
    balance: points.balance,
    totalEarned: points.totalEarned,
    totalSpent: points.totalSpent,
  }

  return c.json<GETV1PointsResponse>(response, { headers: { 'Cache-Control': cacheControl } })
})

export default route
