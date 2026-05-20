import type { GETV1LibrarySummaryResponse } from '@litomi/contracts'

import { db } from '@litomi/db/app'
import { bookmarkTable, readingHistoryTable, userRatingTable } from '@litomi/db/app/activity'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/adult'
import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'

const librarySummaryRoutes = new Hono<Env>()

librarySummaryRoutes.get('/', requireAuth, requireAdult, async (c) => {
  const userId = c.get('userId')!

  try {
    const [counts] = await db.execute<GETV1LibrarySummaryResponse>(sql`
      SELECT 
        (SELECT COUNT(*)::int FROM ${bookmarkTable} WHERE ${bookmarkTable.userId} = ${userId}) as "bookmarkCount",
        (SELECT COUNT(*)::int FROM ${readingHistoryTable} WHERE ${readingHistoryTable.userId} = ${userId}) as "historyCount",
        (SELECT COUNT(*)::int FROM ${userRatingTable} WHERE ${userRatingTable.userId} = ${userId}) as "ratingCount"
    `)

    const result = {
      bookmarkCount: counts?.bookmarkCount ?? 0,
      historyCount: counts?.historyCount ?? 0,
      ratingCount: counts?.ratingCount ?? 0,
    }

    const cacheControl = createCacheControl({ private: true, maxAge: sec('1 minute') })

    return c.json<GETV1LibrarySummaryResponse>(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '요약 정보를 불러오지 못했어요' })
  }
})

export default librarySummaryRoutes
