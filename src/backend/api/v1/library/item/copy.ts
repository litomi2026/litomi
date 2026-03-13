import { and, count, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_ITEMS_PER_LIBRARY } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'

import { copyItemBodySchema, LibraryItemError, POSTV1LibraryItemCopyResponse } from './schema'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', copyItemBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { mangaIds, toLibraryId } = c.req.valid('json')
  const requestedMangaIds = [...new Set(mangaIds)]

  try {
    const result = await db.transaction(async (tx) => {
      const [library] = await tx
        .select({ id: libraryTable.id })
        .from(libraryTable)
        .where(and(eq(libraryTable.userId, userId), eq(libraryTable.id, toLibraryId)))
        .for('update')

      if (!library) {
        throw new Error(LibraryItemError.NOT_FOUND)
      }

      const [{ currentCount }] = await tx
        .select({ currentCount: count(libraryItemTable.mangaId) })
        .from(libraryItemTable)
        .where(eq(libraryItemTable.libraryId, toLibraryId))

      const availableSlots = MAX_ITEMS_PER_LIBRARY - currentCount

      if (availableSlots <= 0) {
        throw new Error(LibraryItemError.LIBRARY_FULL)
      }

      const existingItems = await tx
        .select({ mangaId: libraryItemTable.mangaId })
        .from(libraryItemTable)
        .where(and(eq(libraryItemTable.libraryId, toLibraryId), inArray(libraryItemTable.mangaId, requestedMangaIds)))

      const existingMangaIds = new Set(existingItems.map((item) => item.mangaId))
      const newMangaIds = requestedMangaIds.filter((mangaId) => !existingMangaIds.has(mangaId)).slice(0, availableSlots)

      if (newMangaIds.length === 0) {
        throw new Error(LibraryItemError.NO_NEW_MANGA)
      }

      const inserted = await tx
        .insert(libraryItemTable)
        .values(newMangaIds.map((mangaId) => ({ libraryId: toLibraryId, mangaId })))
        .returning({ inserted: sql<number>`1` })

      return inserted
    })

    return c.json<POSTV1LibraryItemCopyResponse>({ copiedCount: result.length })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === LibraryItemError.NOT_FOUND) {
        return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
      }

      if (error.message === LibraryItemError.LIBRARY_FULL) {
        return problemResponse(c, { status: 403, detail: '서재가 가득 찼어요' })
      }

      if (error.message === LibraryItemError.NO_NEW_MANGA) {
        return problemResponse(c, { status: 403, detail: '이미 서재에 있는 작품이에요' })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재에 작품을 복사하지 못했어요' })
  }
})

export default route
