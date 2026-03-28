import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { POINT_CONSTANTS } from '@/constants/points'
import { MAX_MANGA_ID } from '@/constants/policy'
import { readingHistoryTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'

const deleteSelectedBodySchema = z.object({
  mode: z.literal('selected'),
  mangaIds: z
    .array(z.coerce.number().int().positive().max(MAX_MANGA_ID))
    .min(1)
    .max(POINT_CONSTANTS.HISTORY_MAX_EXPANSION),
})

const deleteAllBodySchema = z.object({
  mode: z.literal('all'),
})

const deleteReadingHistoryBodySchema = z.discriminatedUnion('mode', [deleteSelectedBodySchema, deleteAllBodySchema])

export type DELETEV1ReadingHistoryBody = z.infer<typeof deleteReadingHistoryBodySchema>
export type DELETEV1ReadingHistoryResponse = { deletedCount: number }

const route = new Hono<Env>()

route.delete('/', requireAuth, requireAdult, zProblemValidator('json', deleteReadingHistoryBodySchema), async (c) => {
  const userId = c.get('userId')!
  const body = c.req.valid('json')

  try {
    const deletedCount = await db.transaction(async (tx) => {
      await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

      if (body.mode === 'all') {
        const deleted = await tx
          .delete(readingHistoryTable)
          .where(eq(readingHistoryTable.userId, userId))
          .returning({ deleted: sql<number>`1` })

        return deleted.length
      }

      const mangaIds = [...new Set(body.mangaIds)]

      const deleted = await tx
        .delete(readingHistoryTable)
        .where(and(eq(readingHistoryTable.userId, userId), inArray(readingHistoryTable.mangaId, mangaIds)))
        .returning({ deleted: sql<number>`1` })

      return deleted.length
    })

    return c.json<DELETEV1ReadingHistoryResponse>({ deletedCount })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '감상 기록을 삭제하지 못했어요' })
  }
})

export default route
