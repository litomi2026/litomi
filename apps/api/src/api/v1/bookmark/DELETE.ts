import { type DELETEV1BookmarkResponse, deleteV1BookmarkBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { bookmarkTable } from '@litomi/db/app/activity'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('json', deleteV1BookmarkBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { mangaIds } = c.req.valid('json')
  const requestedMangaIds = [...new Set(mangaIds)]

  try {
    const deletedCount = await db.transaction(async (tx) => {
      await lockUserRowForUpdate(tx, userId)

      const deleted = await tx
        .delete(bookmarkTable)
        .where(and(eq(bookmarkTable.userId, userId), inArray(bookmarkTable.mangaId, requestedMangaIds)))
        .returning({ deleted: sql<number>`1` })

      return deleted.length
    })

    return c.json({ deletedCount } satisfies DELETEV1BookmarkResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 삭제에 실패했어요' })
  }
})

export default route
