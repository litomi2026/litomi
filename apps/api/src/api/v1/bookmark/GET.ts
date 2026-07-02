import { type GETV1BookmarkResponse, getV1BookmarkQuerySchema } from '@litomi/contracts'
import { selectBookmark } from '@litomi/db/app/query/bookmark'
import { decodeBookmarkCursor } from '@litomi/db/cursor'
import { getNextLibraryItemCursor } from '@litomi/db/sql/library-item-sort'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { getCatalogMangaMap } from '@/utils/catalog-manga'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.get('/', requireAuth, zProblemValidator('query', getV1BookmarkQuerySchema), async (c) => {
  const userId = c.get('userId')!

  try {
    const { cursor, limit, locale, sort } = c.req.valid('query')

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
      sort,
      ...(cursorTime && cursorMangaId ? { cursorMangaId, cursorTime } : {}),
    })

    const hasNextPage = bookmarkRows.length > limit
    const bookmarks = hasNextPage ? bookmarkRows.slice(0, limit) : bookmarkRows
    const lastBookmark = bookmarks[bookmarks.length - 1]
    const nextCursor = hasNextPage ? getNextLibraryItemCursor(lastBookmark) : null
    const mangaIds = bookmarks.map(({ mangaId }) => mangaId)
    const catalogMangaMap = await getCatalogMangaMap(mangaIds, locale)

    const response = {
      bookmarks: bookmarks.map(({ mangaId, createdAt }) => ({
        mangaId,
        createdAt: createdAt.getTime(),
        manga: catalogMangaMap.get(mangaId),
      })),
      nextCursor,
    } satisfies GETV1BookmarkResponse

    return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크를 불러오지 못했어요' })
  }
})

export default route
