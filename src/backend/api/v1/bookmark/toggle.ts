import { and, count, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { bookmarkTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'

import { getBookmarkLimit } from './limit'

export type POSTV1BookmarkToggleResponse = {
  mangaId: number
  createdAt: string | null
}

const toggleSchema = z.object({
  mangaId: z.coerce.number().int().positive(),
})

const route = new Hono<Env>()

route.post('/', requireAuth, zProblemValidator('json', toggleSchema), async (c) => {
  const userId = c.get('userId')!
  const { mangaId } = c.req.valid('json')

  try {
    const { createdAt } = await db.transaction(async (tx) => {
      // 1) 유저 락으로 동시성 보장
      await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

      // 2) 북마크 저장 한도 계산
      const limit = await getBookmarkLimit(tx, userId)

      // 3) 이미 있으면 삭제
      const [existing] = await tx
        .select({ createdAt: bookmarkTable.createdAt })
        .from(bookmarkTable)
        .where(and(eq(bookmarkTable.userId, userId), eq(bookmarkTable.mangaId, mangaId)))

      if (existing) {
        await tx.delete(bookmarkTable).where(and(eq(bookmarkTable.userId, userId), eq(bookmarkTable.mangaId, mangaId)))
        return { createdAt: null }
      }

      // 4) 한도 체크 후 추가
      const [{ count: currentCount }] = await tx
        .select({ count: count(bookmarkTable.mangaId) })
        .from(bookmarkTable)
        .where(eq(bookmarkTable.userId, userId))

      if (Number(currentCount) >= limit) {
        throw new Error('BOOKMARK_LIMIT_REACHED')
      }

      const [{ createdAt }] = await tx
        .insert(bookmarkTable)
        .values({ userId, mangaId })
        .returning({ createdAt: bookmarkTable.createdAt })

      return { createdAt }
    })

    return c.json<POSTV1BookmarkToggleResponse>({
      mangaId,
      createdAt: createdAt ? createdAt.toISOString() : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === 'BOOKMARK_LIMIT_REACHED') {
      return problemResponse(c, {
        status: 403,
        detail: '북마크 저장 한도에 도달했어요. 리보로 확장할 수 있어요.',
      })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 처리에 실패했어요' })
  }
})

export default route
