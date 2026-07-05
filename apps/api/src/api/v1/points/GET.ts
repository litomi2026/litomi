import type { GETV1PointsResponse } from '@litomi/contracts'

import { db } from '@litomi/db/app'
import { userPointsTable } from '@litomi/db/app/points'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

route.get('/', ...middlewares, async (c) => {
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
      } satisfies GETV1PointsResponse

      return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
    }

    const response = {
      balance: points.balance,
      totalEarned: points.totalEarned,
      totalSpent: points.totalSpent,
    } satisfies GETV1PointsResponse

    return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
