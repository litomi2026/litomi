import { deleteV1ReadingHistoryBodySchema, type DELETEV1ReadingHistoryResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { readingHistoryTable } from '@litomi/db/app/activity'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/adult'
import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', requireAuth, requireAdult, zProblemValidator('json', deleteV1ReadingHistoryBodySchema), async (c) => {
  const userId = c.get('userId')!
  const body = c.req.valid('json')

  try {
    const deletedCount = await db.transaction(async (tx) => {
      await lockUserRowForUpdate(tx, userId)

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
