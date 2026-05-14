import { db } from '@litomi/db/database/supabase/drizzle'
import { libraryTable } from '@litomi/db/database/supabase/library'
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
