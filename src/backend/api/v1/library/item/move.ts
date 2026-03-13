import { and, count, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_ITEMS_PER_LIBRARY } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'

import { LibraryItemError, moveItemBodySchema, POSTV1LibraryItemMoveResponse } from './schema'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', moveItemBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { fromLibraryId, mangaIds, toLibraryId } = c.req.valid('json')
  const requestedMangaIds = [...new Set(mangaIds)]

  try {
    const result = await db.transaction(async (tx) => {
      const [minId, maxId] = fromLibraryId < toLibraryId ? [fromLibraryId, toLibraryId] : [toLibraryId, fromLibraryId]

      const libraries = await tx
        .select({ id: libraryTable.id })
        .from(libraryTable)
        .where(and(eq(libraryTable.userId, userId), inArray(libraryTable.id, [minId, maxId])))
        .orderBy(libraryTable.id)
        .for('update')

      if (libraries.length !== 2) {
        throw new Error(LibraryItemError.NOT_FOUND)
      }

      const [{ boundedTargetCount }] = await tx
        .select({ boundedTargetCount: count(libraryItemTable.mangaId) })
        .from(libraryItemTable)
        .where(eq(libraryItemTable.libraryId, toLibraryId))

      const availableSlots = MAX_ITEMS_PER_LIBRARY - Number(boundedTargetCount)

      if (availableSlots <= 0) {
        throw new Error(LibraryItemError.LIBRARY_FULL)
      }

      const sourceItems = await tx
        .select({ mangaId: libraryItemTable.mangaId })
        .from(libraryItemTable)
        .where(and(eq(libraryItemTable.libraryId, fromLibraryId), inArray(libraryItemTable.mangaId, requestedMangaIds)))

      const sourceMangaSet = new Set(sourceItems.map((item) => item.mangaId))
      const sourceMangaIds = requestedMangaIds.filter((mangaId) => sourceMangaSet.has(mangaId))

      if (sourceMangaIds.length === 0) {
        throw new Error(LibraryItemError.NO_SOURCE_ITEMS)
      }

      const existingInTarget = await tx
        .select({ mangaId: libraryItemTable.mangaId })
        .from(libraryItemTable)
        .where(and(eq(libraryItemTable.libraryId, toLibraryId), inArray(libraryItemTable.mangaId, sourceMangaIds)))
        .limit(sourceMangaIds.length)

      const existingSet = new Set(existingInTarget.map((item) => item.mangaId))
      const movableMangaIds = sourceMangaIds.filter((mangaId) => !existingSet.has(mangaId)).slice(0, availableSlots)

      if (movableMangaIds.length === 0) {
        throw new Error(LibraryItemError.NO_MOVABLE_ITEMS)
      }

      await tx
        .delete(libraryItemTable)
        .where(and(eq(libraryItemTable.libraryId, fromLibraryId), inArray(libraryItemTable.mangaId, movableMangaIds)))

      const inserted = await tx
        .insert(libraryItemTable)
        .values(movableMangaIds.map((mangaId) => ({ libraryId: toLibraryId, mangaId })))
        .returning({ inserted: sql<number>`1` })

      return inserted
    })

    return c.json<POSTV1LibraryItemMoveResponse>({ movedCount: result.length })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === LibraryItemError.NOT_FOUND) {
        return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
      }

      if (error.message === LibraryItemError.LIBRARY_FULL) {
        return problemResponse(c, { status: 403, detail: '대상 서재가 가득 찼어요' })
      }

      if (error.message === LibraryItemError.NO_SOURCE_ITEMS) {
        return problemResponse(c, { status: 403, detail: '이동할 작품을 찾을 수 없어요' })
      }

      if (error.message === LibraryItemError.NO_MOVABLE_ITEMS) {
        return problemResponse(c, { status: 403, detail: '이미 대상 서재에 있는 작품이에요' })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재에 작품을 이동하지 못했어요' })
  }
})

export default route
