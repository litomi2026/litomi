import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { lockUserRowForUpdate } from '@/backend/utils/lock-user-row'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { bookmarkTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

import { BookmarkLimitReachedError, saveBookmarks } from './save'

export type POSTV1BookmarkImportResponse = {
  imported: number
  skipped: number
}

const importSchema = z.object({
  mode: z.enum(['merge', 'replace']),
  bookmarks: z
    .array(
      z.object({
        mangaId: z.number().int().positive(),
        createdAt: z.coerce.date().optional(),
      }),
    )
    .min(1),
})

const route = new Hono<Env>()

route.post('/', requireAuth, requireAdult, zProblemValidator('json', importSchema), async (c) => {
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

    return c.json<POSTV1BookmarkImportResponse>({
      imported,
      skipped,
    })
  } catch (error) {
    if (error instanceof BookmarkLimitReachedError) {
      return problemResponse(c, {
        status: 403,
        code: 'libo-expansion-required',
        detail: '북마크 저장 한도에 도달했어요',
      })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 가져오기에 실패했어요' })
  }
})

export default route
