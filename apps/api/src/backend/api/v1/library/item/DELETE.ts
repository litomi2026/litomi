import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'

import { deleteItemBodySchema, DELETEV1LibraryItemResponse, LibraryItemError } from './schema'

const route = new Hono<Env>()

route.delete('/', zProblemValidator('json', deleteItemBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { libraryId, mangaIds } = c.req.valid('json')
  const requestedMangaIds = [...new Set(mangaIds)]

  try {
    const removedCount = await db.transaction(async (tx) => {
      const [library] = await tx
        .select({ id: libraryTable.id })
        .from(libraryTable)
        .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId)))
        .for('update')

      if (!library) {
        throw new Error(LibraryItemError.NOT_FOUND)
      }

      const deleted = await tx
        .delete(libraryItemTable)
        .where(and(eq(libraryItemTable.libraryId, libraryId), inArray(libraryItemTable.mangaId, requestedMangaIds)))
        .returning({ deleted: sql<number>`1` })

      return deleted.length
    })

    return c.json<DELETEV1LibraryItemResponse>({ removedCount })
  } catch (error) {
    if (error instanceof Error && error.message === LibraryItemError.NOT_FOUND) {
      return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재에서 작품을 삭제하지 못했어요' })
  }
})

export default route
