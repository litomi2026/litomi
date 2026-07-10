import { type DELETEV1LibraryItemResponse, deleteV1LibraryItemBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryItemTable, libraryTable } from '@litomi/db/app/library'
import { anyOf } from '@litomi/db/sql'
import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { LibraryItemError } from './error'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', deleteV1LibraryItemBodySchema))

route.delete('/', ...middlewares, async (c) => {
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
        .where(and(eq(libraryItemTable.libraryId, libraryId), anyOf(libraryItemTable.mangaId, requestedMangaIds)))
        .returning({ deleted: sql<number>`1` })

      return deleted.length
    })

    return c.json({ removedCount } satisfies DELETEV1LibraryItemResponse)
  } catch (error) {
    if (error instanceof Error && error.message === LibraryItemError.NOT_FOUND) {
      return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
