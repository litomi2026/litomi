import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { bookmarkTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'

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
      await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

      await tx.delete(bookmarkTable).where(and(eq(bookmarkTable.userId, userId), eq(bookmarkTable.mangaId, mangaId)))
    })

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 삭제에 실패했어요' })
  }
})

export default route
