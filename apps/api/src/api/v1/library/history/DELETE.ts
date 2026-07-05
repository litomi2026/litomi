import { type DELETEV1ReadingHistoryResponse, deleteV1ReadingHistoryBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { readingHistoryTable } from '@litomi/db/app/activity'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  requireAdult,
  zProblemValidator('json', deleteV1ReadingHistoryBodySchema),
)

route.delete('/', ...middlewares, async (c) => {
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

    return c.json({ deletedCount } satisfies DELETEV1ReadingHistoryResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
