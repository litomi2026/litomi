import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import { libraryTable } from '@/database/supabase/library'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DELETEV1LibraryIdResponse = { id: number }

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('param', paramsSchema), async (c) => {
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

    return c.json<DELETEV1LibraryIdResponse>({ id: deletedLibrary.id })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재를 삭제하지 못했어요' })
  }
})

export default route
