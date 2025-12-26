import { zValidator } from '@hono/zod-validator'
import { count, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { db } from '@/database/supabase/drizzle'
import { bookmarkTable, userTable } from '@/database/supabase/schema'

import { getBookmarkLimit } from './limit'

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

route.post('/', zValidator('json', importSchema), async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  const { bookmarks, mode } = c.req.valid('json')

  try {
    const { imported, skipped } = await db.transaction(async (tx) => {
      // 1) 유저 락으로 동시성 보장
      await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

      // 2) 북마크 저장 한도 계산
      const limit = await getBookmarkLimit(tx, userId)

      const now = new Date()
      const newBookmarks = bookmarks.map((bookmark) => ({
        mangaId: bookmark.mangaId,
        userId,
        createdAt: bookmark.createdAt ?? now,
      }))

      if (mode === 'replace') {
        if (newBookmarks.length > limit) {
          throw new Error('IMPORT_LIMIT_REACHED_REPLACE')
        }

        await tx.delete(bookmarkTable).where(eq(bookmarkTable.userId, userId))
        const inserted = await tx
          .insert(bookmarkTable)
          .values(newBookmarks)
          .onConflictDoNothing()
          .returning({ mangaId: bookmarkTable.mangaId })

        return {
          imported: inserted.length,
          skipped: newBookmarks.length - inserted.length,
        }
      }

      const [{ count: currentCount }] = await tx
        .select({ count: count(bookmarkTable.mangaId) })
        .from(bookmarkTable)
        .where(eq(bookmarkTable.userId, userId))

      if (Number(currentCount) >= limit) {
        throw new Error('IMPORT_LIMIT_REACHED_MERGE')
      }

      const availableSlots = limit - Number(currentCount)

      if (newBookmarks.length > availableSlots) {
        throw new Error(`IMPORT_NOT_ENOUGH_SLOTS:${availableSlots}`)
      }

      const inserted = await tx
        .insert(bookmarkTable)
        .values(newBookmarks)
        .onConflictDoNothing()
        .returning({ mangaId: bookmarkTable.mangaId })

      return {
        imported: inserted.length,
        skipped: newBookmarks.length - inserted.length,
      }
    })

    return c.json<POSTV1BookmarkImportResponse>({
      imported,
      skipped,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === 'IMPORT_LIMIT_REACHED_REPLACE') {
      throw new HTTPException(403, { message: '북마크 저장 한도에 도달했어요. 리보로 확장할 수 있어요' })
    }
    if (message === 'IMPORT_LIMIT_REACHED_MERGE') {
      throw new HTTPException(403, { message: '북마크 저장 한도에 도달했어요. 리보로 확장할 수 있어요' })
    }
    if (message.startsWith('IMPORT_NOT_ENOUGH_SLOTS:')) {
      const availableSlots = Number(message.split(':')[1] ?? 0)
      throw new HTTPException(403, { message: `최대 ${availableSlots.toLocaleString()}개만 추가로 가져올 수 있어요` })
    }

    console.error(error)
    throw new HTTPException(500, { message: '북마크 가져오기에 실패했어요' })
  }
})

export default route
