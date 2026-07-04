import { type GETV1MangaIdReportResponse, mangaIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { mangaReportTable } from '@litomi/db/app/report'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import ms from 'ms'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const REPORT_DEDUPE_TTL_MS = ms('30 days')

const route = new Hono<Env>()

route.get('/:id/report', requireAuth, requireAdult, zProblemValidator('param', mangaIdParamSchema), async (c) => {
  const userId = c.get('userId')!

  const { id: mangaId } = c.req.valid('param')

  try {
    const [report] = await db
      .select({ reportedAt: mangaReportTable.reportedAt })
      .from(mangaReportTable)
      .where(and(eq(mangaReportTable.userId, userId), eq(mangaReportTable.mangaId, mangaId)))

    const cutoff = new Date(Date.now() - REPORT_DEDUPE_TTL_MS)
    const alreadyReported = Boolean(report && report.reportedAt.getTime() >= cutoff.getTime())
    const result = { alreadyReported } satisfies GETV1MangaIdReportResponse

    return c.json(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
