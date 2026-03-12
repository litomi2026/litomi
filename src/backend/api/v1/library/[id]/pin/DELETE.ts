import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import { pinnedLibraryTable } from '@/database/supabase/library'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const routes = new Hono<Env>()

routes.delete('/', requireAuth, zProblemValidator('param', paramsSchema), async (c) => {
  const { id: libraryId } = c.req.valid('param')
  const userId = c.get('userId')!

  try {
    await db
      .delete(pinnedLibraryTable)
      .where(and(eq(pinnedLibraryTable.userId, userId), eq(pinnedLibraryTable.libraryId, libraryId)))

    return c.json({ result: 'ok' })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재 고정을 해제하지 못했어요' })
  }
})

export default routes
