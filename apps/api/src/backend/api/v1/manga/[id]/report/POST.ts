import { lt } from 'drizzle-orm'
import { Hono } from 'hono'
import ms from 'ms'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { isPostgresError } from '@/database/error'
import { db } from '@/database/supabase/drizzle'
import { mangaReportTable } from '@/database/supabase/report'

export const MangaReportReason = {
  DEEPFAKE: 'DEEPFAKE',
  REAL_PERSON_MINOR: 'REAL_PERSON_MINOR',
} as const

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

const postBodySchema = z.object({
  reason: z.enum(Object.values(MangaReportReason)),
})

export type POSTV1MangaIdReportBody = z.infer<typeof postBodySchema>

export type POSTV1MangaIdReportResponse = {
  accepted: boolean
  duplicated: boolean
}

const REPORT_DEDUPE_TTL_MS = ms('30 days')

const route = new Hono<Env>()

route.post(
  '/:id/report',
  requireAuth,
  requireAdult,
  zProblemValidator('param', paramSchema),
  zProblemValidator('json', postBodySchema),
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
