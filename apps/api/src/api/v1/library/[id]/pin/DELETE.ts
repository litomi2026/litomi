import { db } from '@litomi/db/database/app/drizzle'
import { pinnedLibraryTable } from '@litomi/db/database/app/library'
import 'server-only'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

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
