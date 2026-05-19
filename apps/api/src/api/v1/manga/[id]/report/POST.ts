import {
  mangaIdParamSchema,
  postV1MangaIdReportBodySchema,
  type POSTV1MangaIdReportResponse,
} from '@litomi/contracts'
import { db } from '@litomi/db/database/app/drizzle'
import { mangaReportTable } from '@litomi/db/database/app/report'
import { isPostgresError } from '@litomi/db/database/error'
import { lt } from 'drizzle-orm'
import { Hono } from 'hono'
import ms from 'ms'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/adult'
import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const REPORT_DEDUPE_TTL_MS = ms('30 days')

const route = new Hono<Env>()

route.post(
  '/:id/report',
  requireAuth,
  requireAdult,
  zProblemValidator('param', mangaIdParamSchema),
  zProblemValidator('json', postV1MangaIdReportBodySchema),
  async (c) => {
    const userId = c.get('userId')!

    const { id: mangaId } = c.req.valid('param')
    const { reason } = c.req.valid('json')
    const now = new Date()
    const cutoff = new Date(now.getTime() - REPORT_DEDUPE_TTL_MS)

    try {
      const [written] = await db
        .insert(mangaReportTable)
        .values({ userId, mangaId, reason, reportedAt: now })
        .onConflictDoUpdate({
          target: [mangaReportTable.userId, mangaReportTable.mangaId],
          set: { reason, reportedAt: now },
          where: lt(mangaReportTable.reportedAt, cutoff),
        })
        .returning({ reportedAt: mangaReportTable.reportedAt })

      if (!written) {
        return c.json<POSTV1MangaIdReportResponse>({ accepted: false, duplicated: true })
      }

      return c.json<POSTV1MangaIdReportResponse>({ accepted: true, duplicated: false })
    } catch (error) {
      if (isPostgresError(error) && error.cause.code === '23505') {
        return c.json<POSTV1MangaIdReportResponse>({ accepted: false, duplicated: true })
      }

      console.error(error)
      return problemResponse(c, { status: 500, detail: '신고를 접수하지 못했어요' })
    }
  },
)

export default route
