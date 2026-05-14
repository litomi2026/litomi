import { bookmarkTable } from '@litomi/db/database/supabase/activity'
import { db } from '@litomi/db/database/supabase/drizzle'
import 'server-only'
import { MAX_MANGA_ID } from '@litomi/domain/constants/policy'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { lockUserRowForUpdate } from '@/backend/utils/lock-user-row'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type DELETEV1BookmarkIdResponse = void

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('param', paramSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: mangaId } = c.req.valid('param')

  try {
    await db.transaction(async (tx) => {
      // Use the same per-user lock as PUT so concurrent bookmark writes stay ordered.
      await lockUserRowForUpdate(tx, userId)

      await tx.delete(bookmarkTable).where(and(eq(bookmarkTable.userId, userId), eq(bookmarkTable.mangaId, mangaId)))
    })

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 삭제에 실패했어요' })
  }
})

export default route
