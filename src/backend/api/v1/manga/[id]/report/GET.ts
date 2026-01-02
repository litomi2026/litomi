import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import ms from 'ms'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { mangaReportTable } from '@/database/supabase/report'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type GETV1MangaIdReportResponse = {
  alreadyReported: boolean
}

const REPORT_DEDUPE_TTL_MS = ms('30 days')

const route = new Hono<Env>()

route.get('/:id/report', requireAuth, requireAdult, zProblemValidator('param', paramSchema), async (c) => {
  const userId = c.get('userId')!

  const { id: mangaId } = c.req.valid('param')

  try {
    const [report] = await db
      .select({ reportedAt: mangaReportTable.reportedAt })
      .from(mangaReportTable)
      .where(and(eq(mangaReportTable.userId, userId), eq(mangaReportTable.mangaId, mangaId)))

    const cutoff = new Date(Date.now() - REPORT_DEDUPE_TTL_MS)
    const alreadyReported = Boolean(report && report.reportedAt.getTime() >= cutoff.getTime())
    const result = { alreadyReported }

    return c.json<GETV1MangaIdReportResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '신고 내역을 불러오지 못했어요' })
  }
})

export default route
