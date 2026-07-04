import { type DELETEV1LibraryRatingResponse, deleteV1LibraryRatingBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userRatingTable } from '@litomi/db/app/activity'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('json', deleteV1LibraryRatingBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { mangaIds } = c.req.valid('json')
  const requestedMangaIds = [...new Set(mangaIds)]

  try {
    const deleted = await db
      .delete(userRatingTable)
      .where(and(eq(userRatingTable.userId, userId), inArray(userRatingTable.mangaId, requestedMangaIds)))
      .returning({ deleted: sql<number>`1` })

    return c.json({ deletedCount: deleted.length } satisfies DELETEV1LibraryRatingResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
