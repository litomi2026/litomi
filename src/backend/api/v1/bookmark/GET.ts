import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { decodeBookmarkCursor, encodeBookmarkCursor } from '@/common/cursor'
import { BOOKMARKS_PER_PAGE } from '@/constants/policy'
import { selectBookmark } from '@/sql/selectBookmark'

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(BOOKMARKS_PER_PAGE).default(BOOKMARKS_PER_PAGE),
})

export type Bookmark = {
  mangaId: number
  createdAt: number
}

export type GETV1BookmarkResponse = {
  bookmarks: Bookmark[]
  nextCursor: string | null
}

const route = new Hono<Env>()

route.get('/', requireAuth, zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')!

  try {
    const { cursor, limit } = c.req.valid('query')

    let cursorMangaId: number | undefined
    let cursorTime: Date | undefined

    if (cursor) {
      const decoded = decodeBookmarkCursor(cursor)

      if (!decoded) {
        return problemResponse(c, { status: 400 })
      }

      cursorMangaId = decoded.mangaId
      cursorTime = new Date(decoded.timestamp)
    }

    const bookmarkRows = await selectBookmark({
      userId,
      limit: limit + 1,
      cursorMangaId,
      cursorTime,
    })

    const hasNextPage = bookmarkRows.length > limit
    const bookmarks = hasNextPage ? bookmarkRows.slice(0, limit) : bookmarkRows
    const lastBookmark = bookmarks[bookmarks.length - 1]
    const nextCursor = hasNextPage ? encodeBookmarkCursor(lastBookmark.createdAt.getTime(), lastBookmark.mangaId) : null

    const response = {
      bookmarks: bookmarks.map(({ mangaId, createdAt }) => ({
        mangaId,
        createdAt: createdAt.getTime(),
      })),
      nextCursor,
    }

    return c.json<GETV1BookmarkResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크를 불러오지 못했어요' })
  }
})

export default route
