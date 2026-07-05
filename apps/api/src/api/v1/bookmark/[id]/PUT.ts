import { mangaIdParamSchema, PROBLEM, type PUTV1BookmarkIdResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { bookmarkTable } from '@litomi/db/app/activity'
import { and, count, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { getBookmarkLimit } from '../limit'

const ErrorCode = {
  BOOKMARK_INSERT_FAILED: 'BOOKMARK_INSERT_FAILED',
  BOOKMARK_LIMIT_REACHED: 'BOOKMARK_LIMIT_REACHED',
} as const

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, requireAdult, zProblemValidator('param', mangaIdParamSchema))

route.put('/', ...middlewares, async (c) => {
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

    const response = {
      mangaId: result.mangaId,
      createdAt: result.createdAt,
    } satisfies PUTV1BookmarkIdResponse

    return c.json(response, result.status)
  } catch (error) {
    if (error instanceof Error && error.message === ErrorCode.BOOKMARK_LIMIT_REACHED) {
      return problemResponse(c, { problem: PROBLEM.LIBO_EXPANSION_REQUIRED })
    }

    if (error instanceof Error && error.message === ErrorCode.BOOKMARK_INSERT_FAILED) {
      return problemResponse(c, { status: 500 })
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
