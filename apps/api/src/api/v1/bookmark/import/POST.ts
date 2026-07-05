import { type POSTV1BookmarkImportResponse, PROBLEM, postV1BookmarkImportBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { bookmarkTable } from '@litomi/db/app/activity'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { BookmarkLimitReachedError, saveBookmarks } from '../save'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  requireAdult,
  zProblemValidator('json', postV1BookmarkImportBodySchema),
)

route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!

  const { bookmarks, mode } = c.req.valid('json')

  try {
    const { imported, skipped } = await db.transaction(async (tx) => {
      // 1) 유저 락으로 동시성 보장
      await lockUserRowForUpdate(tx, userId)

      const now = new Date()

      const newBookmarks = bookmarks.map((bookmark) => ({
        mangaId: bookmark.mangaId,
        createdAt: bookmark.createdAt ?? now,
      }))

      if (mode === 'replace') {
        await tx.delete(bookmarkTable).where(eq(bookmarkTable.userId, userId))
      }

      const result = await saveBookmarks(tx, userId, newBookmarks)

      return {
        imported: result.createdMangaIds.length,
        skipped: bookmarks.length - result.createdMangaIds.length,
      }
    })

    return c.json({
      imported,
      skipped,
    } satisfies POSTV1BookmarkImportResponse)
  } catch (error) {
    if (error instanceof BookmarkLimitReachedError) {
      return problemResponse(c, { problem: PROBLEM.LIBO_EXPANSION_REQUIRED })
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
