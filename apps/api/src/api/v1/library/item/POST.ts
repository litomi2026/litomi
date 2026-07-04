import { type POSTV1LibraryItemAddResponse, postV1LibraryItemAddBodySchema, problemCode } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryItemTable, libraryTable } from '@litomi/db/app/library'
import { MAX_ITEMS_PER_LIBRARY } from '@litomi/domain/library/policy'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { LibraryItemError } from './error'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1LibraryItemAddBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { mangaId, libraryIds } = c.req.valid('json')
  const requestedLibraryIds = [...new Set(libraryIds)].sort((a, b) => a - b)

  try {
    const result = await db.transaction(async (tx) => {
      const libraries = await tx
        .select({ id: libraryTable.id })
        .from(libraryTable)
        .where(and(eq(libraryTable.userId, userId), inArray(libraryTable.id, requestedLibraryIds)))
        .orderBy(libraryTable.id)
        .for('update')

      if (libraries.length === 0) {
        throw new Error(LibraryItemError.NOT_FOUND)
      }

      const lockedLibraryIds = libraries.map((lib) => lib.id)

      const itemCounts = await tx
        .select({
          libraryId: libraryItemTable.libraryId,
          count: sql<number>`COUNT(*)`,
        })
        .from(libraryItemTable)
        .where(inArray(libraryItemTable.libraryId, lockedLibraryIds))
        .groupBy(libraryItemTable.libraryId)

      const countMap = new Map(itemCounts.map((itemCount) => [itemCount.libraryId, Number(itemCount.count)]))

      const insertableLibraryIds = lockedLibraryIds.filter((libraryId) => {
        const currentCount = countMap.get(libraryId) ?? 0
        return currentCount < MAX_ITEMS_PER_LIBRARY
      })

      if (insertableLibraryIds.length === 0) {
        throw new Error(LibraryItemError.NO_VALID_LIBRARIES)
      }

      const inserted = await tx
        .insert(libraryItemTable)
        .values(insertableLibraryIds.map((libraryId) => ({ libraryId, mangaId })))
        .onConflictDoNothing()
        .returning({ inserted: sql<number>`1` })

      if (inserted.length === 0) {
        throw new Error(LibraryItemError.NO_VALID_LIBRARIES)
      }

      return inserted
    })

    return c.json({ addedCount: result.length } satisfies POSTV1LibraryItemAddResponse)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === LibraryItemError.NOT_FOUND) {
        return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
      }

      if (error.message === LibraryItemError.NO_VALID_LIBRARIES) {
        return problemResponse(c, {
          status: 403,
          code: problemCode.LIBRARY_ITEM_CONFLICT,
          title: '이미 모든 서재에 있거나 서재가 가득 찼어요',
        })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
