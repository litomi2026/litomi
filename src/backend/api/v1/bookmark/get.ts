import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { decodeBookmarkCursor, encodeBookmarkCursor } from '@/common/cursor'
import { BOOKMARKS_PER_PAGE } from '@/constants/policy'
import selectBookmarks from '@/sql/selectBookmarks'
import { createCacheControl } from '@/utils/cache-control'

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(BOOKMARKS_PER_PAGE).optional(),
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

route.get('/', zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  try {
    const { cursor, limit } = c.req.valid('query')

    let cursorId: number | undefined
    let cursorTime: Date | undefined

    if (cursor) {
      const decoded = decodeBookmarkCursor(cursor)

      if (!decoded) {
        return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
      }

      cursorId = decoded.mangaId
      cursorTime = new Date(decoded.timestamp)
    }

    const bookmarkRows = await selectBookmarks({
      userId,
      limit: limit ? limit + 1 : undefined,
      cursorId,
      cursorTime,
    })

    const hasNextPage = limit ? bookmarkRows.length > limit : false
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

    const cacheControl = createCacheControl({
      private: true,
      maxAge: 3,
    })

    return c.json<GETV1BookmarkResponse>(response, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크를 불러오지 못했어요' })
  }
})

export default route
