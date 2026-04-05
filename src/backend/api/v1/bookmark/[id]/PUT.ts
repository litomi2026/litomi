import { and, count, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { lockUserRowForUpdate } from '@/backend/utils/lock-user-row'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { bookmarkTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

import { getBookmarkLimit } from '../limit'

const ErrorCode = {
  BOOKMARK_INSERT_FAILED: 'BOOKMARK_INSERT_FAILED',
  BOOKMARK_LIMIT_REACHED: 'BOOKMARK_LIMIT_REACHED',
} as const

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type PUTV1BookmarkIdResponse = {
  mangaId: number
  createdAt: number
}

const route = new Hono<Env>()

route.put('/', requireAuth, zProblemValidator('param', paramSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: mangaId } = c.req.valid('param')

  try {
    const result = await db.transaction(async (tx) => {
      // Serialize bookmark writes per user so mixed PUT/DELETE requests resolve predictably.
      await lockUserRowForUpdate(tx, userId)

      const [existing] = await tx
        .select({ createdAt: bookmarkTable.createdAt })
        .from(bookmarkTable)
        .where(and(eq(bookmarkTable.userId, userId), eq(bookmarkTable.mangaId, mangaId)))

      if (existing) {
        return {
          createdAt: existing.createdAt.getTime(),
          mangaId,
          status: 200 as const,
        }
      }

      const limit = await getBookmarkLimit(tx, userId)

      const [{ count: currentCount }] = await tx
        .select({ count: count(bookmarkTable.mangaId) })
        .from(bookmarkTable)
        .where(eq(bookmarkTable.userId, userId))

      if (Number(currentCount) >= limit) {
        throw new Error(ErrorCode.BOOKMARK_LIMIT_REACHED)
      }

      const [inserted] = await tx
        .insert(bookmarkTable)
        .values({ userId, mangaId })
        .returning({ createdAt: bookmarkTable.createdAt })

      if (!inserted) {
        throw new Error(ErrorCode.BOOKMARK_INSERT_FAILED)
      }

      return {
        createdAt: inserted.createdAt.getTime(),
        mangaId,
        status: 201 as const,
      }
    })

    return c.json<PUTV1BookmarkIdResponse>({ mangaId: result.mangaId, createdAt: result.createdAt }, result.status)
  } catch (error) {
    if (error instanceof Error && error.message === ErrorCode.BOOKMARK_LIMIT_REACHED) {
      return problemResponse(c, {
        status: 403,
        code: 'libo-expansion-required',
        detail: '북마크 저장 한도에 도달했어요',
      })
    }

    if (error instanceof Error && error.message === ErrorCode.BOOKMARK_INSERT_FAILED) {
      return problemResponse(c, { status: 500, detail: '북마크 저장에 실패했어요' })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 저장에 실패했어요' })
  }
})

export default route
