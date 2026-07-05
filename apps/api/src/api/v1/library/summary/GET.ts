import type { GETV1LibrarySummaryResponse } from '@litomi/contracts'

import { db } from '@litomi/db/app'
import { bookmarkTable, readingHistoryTable, userRatingTable } from '@litomi/db/app/activity'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'

const librarySummaryRoutes = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, requireAdult)

librarySummaryRoutes.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!

  try {
    const [counts] = await db.execute<{ bookmarkCount: number; historyCount: number; ratingCount: number }>(sql`
      SELECT 
        (SELECT COUNT(*)::int FROM ${bookmarkTable} WHERE ${bookmarkTable.userId} = ${userId}) as "bookmarkCount",
        (SELECT COUNT(*)::int FROM ${readingHistoryTable} WHERE ${readingHistoryTable.userId} = ${userId}) as "historyCount",
        (SELECT COUNT(*)::int FROM ${userRatingTable} WHERE ${userRatingTable.userId} = ${userId}) as "ratingCount"
    `)

    const result = {
      bookmarkCount: counts?.bookmarkCount ?? 0,
      historyCount: counts?.historyCount ?? 0,
      ratingCount: counts?.ratingCount ?? 0,
    } satisfies GETV1LibrarySummaryResponse

    const cacheControl = createCacheControl({ private: true, maxAge: sec('1 minute') })

    return c.json(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default librarySummaryRoutes
