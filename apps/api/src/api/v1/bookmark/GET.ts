import { getV1BookmarkQuerySchema, type GETV1BookmarkResponse } from '@litomi/contracts'
import { selectBookmark } from '@litomi/db/query/bookmark'
import { getNextCollectionItemCursor } from '@litomi/db/sql/collection-item-sort'
import { decodeBookmarkCursor } from '@litomi/domain/common/cursor'
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
    const { cursor, limit, sort } = c.req.valid('query')

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
    const nextCursor = hasNextPage ? getNextCollectionItemCursor(lastBookmark) : null
    const catalogMangaMap = await getCatalogMangaMap(bookmarks.map(({ mangaId }) => mangaId))

    const response = {
      bookmarks: bookmarks.map(({ mangaId, createdAt }) => ({
        mangaId,
        createdAt: createdAt.getTime(),
        manga: catalogMangaMap.get(mangaId),
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
