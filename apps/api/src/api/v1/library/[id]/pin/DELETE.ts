import { idParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { pinnedLibraryTable } from '@litomi/db/app/library'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const routes = new Hono<Env>()

routes.delete('/', requireAuth, zProblemValidator('param', idParamSchema), async (c) => {
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
