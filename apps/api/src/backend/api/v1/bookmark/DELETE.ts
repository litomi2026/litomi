import { bookmarkTable } from '@litomi/db/database/supabase/activity'
import { db } from '@litomi/db/database/supabase/drizzle'
import 'server-only'
import { MAX_BOOKMARK_BATCH_SIZE, MAX_MANGA_ID } from '@litomi/domain/constants/policy'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { lockUserRowForUpdate } from '@/backend/utils/lock-user-row'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

const deleteBodySchema = z.object({
  mangaIds: z.array(z.coerce.number().int().positive().max(MAX_MANGA_ID)).min(1).max(MAX_BOOKMARK_BATCH_SIZE),
})

export type DELETEV1BookmarkBody = z.infer<typeof deleteBodySchema>
export type DELETEV1BookmarkResponse = { deletedCount: number }

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('json', deleteBodySchema), async (c) => {
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

    return c.json<DELETEV1BookmarkResponse>({ deletedCount })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 삭제에 실패했어요' })
  }
})

export default route
