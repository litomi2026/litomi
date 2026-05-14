import { userRatingTable } from '@litomi/db/database/supabase/activity'
import { db } from '@litomi/db/database/supabase/drizzle'
import 'server-only'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

const deleteBodySchema = z.object({
  mangaIds: z.array(z.coerce.number().int().positive()).min(1).max(100),
})

export type DELETEV1LibraryRatingBody = z.infer<typeof deleteBodySchema>
export type DELETEV1LibraryRatingResponse = { deletedCount: number }

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('json', deleteBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { mangaIds } = c.req.valid('json')
  const requestedMangaIds = [...new Set(mangaIds)]

  try {
    const deleted = await db
      .delete(userRatingTable)
      .where(and(eq(userRatingTable.userId, userId), inArray(userRatingTable.mangaId, requestedMangaIds)))
      .returning({ deleted: sql<number>`1` })

    return c.json<DELETEV1LibraryRatingResponse>({ deletedCount: deleted.length })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '평가 삭제에 실패했어요' })
  }
})

export default route
