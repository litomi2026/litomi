import { type POSTV1LibraryItemCopyResponse, PROBLEM, postV1LibraryItemCopyBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryItemTable, libraryTable } from '@litomi/db/app/library'
import { anyOf } from '@litomi/db/sql'
import { MAX_ITEMS_PER_LIBRARY } from '@litomi/domain/library/policy'
import { and, count, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { LibraryItemError } from './error'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', postV1LibraryItemCopyBodySchema))

route.post('/', ...middlewares, async (c) => {
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
        .where(and(eq(libraryItemTable.libraryId, toLibraryId), anyOf(libraryItemTable.mangaId, requestedMangaIds)))

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

    return c.json({ copiedCount: result.length } satisfies POSTV1LibraryItemCopyResponse)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === LibraryItemError.NOT_FOUND) {
        return problemResponse(c, {
          status: 404,
          detail: '서재를 찾을 수 없어요',
        })
      }

      if (error.message === LibraryItemError.LIBRARY_FULL) {
        return problemResponse(c, { problem: PROBLEM.LIBRARY_FULL })
      }

      if (error.message === LibraryItemError.NO_NEW_MANGA) {
        return problemResponse(c, { problem: PROBLEM.LIBRARY_ITEM_CONFLICT })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
