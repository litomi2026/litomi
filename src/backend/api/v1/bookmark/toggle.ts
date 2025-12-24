import { zValidator } from '@hono/zod-validator'
import { and, count, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { db } from '@/database/supabase/drizzle'
import { bookmarkTable, userTable } from '@/database/supabase/schema'

import { getBookmarkLimit } from './limit'

export type POSTV1BookmarkToggleErrorResponse = {
  error: string
}

export type POSTV1BookmarkToggleResponse = POSTV1BookmarkToggleErrorResponse | POSTV1BookmarkToggleSuccessResponse

export type POSTV1BookmarkToggleSuccessResponse = {
  success: true
  mangaId: number
  createdAt: string | null
}

const toggleSchema = z.object({
  mangaId: z.coerce.number().int().positive(),
})

const route = new Hono<Env>()

route.post('/', zValidator('json', toggleSchema), async (c) => {
  const userId = getUserId()

  if (!userId) {
    return c.json<POSTV1BookmarkToggleErrorResponse>({ error: '로그인이 필요해요' }, 401)
  }

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

    return c.json<POSTV1BookmarkToggleSuccessResponse>({
      success: true,
      mangaId,
      createdAt: createdAt ? createdAt.toISOString() : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === 'BOOKMARK_LIMIT_REACHED') {
      return c.json<POSTV1BookmarkToggleErrorResponse>(
        { error: '북마크 저장 한도에 도달했어요. 리보로 확장할 수 있어요' },
        403,
      )
    }

    console.error(error)
    return c.json<POSTV1BookmarkToggleErrorResponse>({ error: '북마크 처리에 실패했어요' }, 500)
  }
})

export default route
