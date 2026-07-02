import { type DELETEV1LibraryIdResponse, idParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryTable } from '@litomi/db/app/library'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('param', idParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: libraryId } = c.req.valid('param')

  try {
    const [deletedLibrary] = await db
      .delete(libraryTable)
      .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId)))
      .returning({ id: libraryTable.id })

    if (!deletedLibrary) {
      return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
    }

    return c.json({ id: deletedLibrary.id } satisfies DELETEV1LibraryIdResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재를 삭제하지 못했어요' })
  }
})

export default route
