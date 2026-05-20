import { getLibraryItemsQuerySchema, type GETLibraryItemsResponse, libraryIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryTable } from '@litomi/db/app/library'
import { selectLibraryItem } from '@litomi/db/query/library-item'
import { getNextCollectionItemCursor } from '@litomi/db/sql/collection-item-sort'
import { decodeLibraryIdCursor } from '@litomi/domain/common/cursor'
import { DEFAULT_COLLECTION_ITEM_SORT } from '@litomi/domain/library/sort'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { adultVerificationRequiredResponse, shouldBlockAdultGate } from '@/utils/adult-gate'
import { privateCacheControl } from '@/utils/cache-control'
import { getCatalogMangaMap } from '@/utils/catalog-manga'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const routes = new Hono<Env>()

const sharedCacheControl = createCacheControl({
  public: true,
  maxAge: 3,
  sMaxAge: sec('1 day'),
  swr: sec('10 minutes'),
})

routes.get(
  '/',
  zProblemValidator('param', libraryIdParamSchema),
  zProblemValidator('query', getLibraryItemsQuerySchema),
  async (c) => {
    const { id: libraryId } = c.req.valid('param')
    const { cursor, limit, scope, sort } = c.req.valid('query')
    const userId = c.get('userId')
    const cursorData = cursor ? decodeLibraryIdCursor(cursor) : null
    const isPublicScope = scope === 'public'

    if (scope === 'me' && !userId) {
      return problemResponse(c, { status: 401, detail: '로그인 정보가 없거나 만료됐어요' })
    }

    if (cursor && !cursorData) {
      return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
    }

    try {
      const libraryConditions = isPublicScope
        ? and(eq(libraryTable.id, libraryId), eq(libraryTable.isPublic, true))
        : and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId!))

      const [library] = await db
        .select({ id: libraryTable.id, isPublic: libraryTable.isPublic })
        .from(libraryTable)
        .where(libraryConditions)

      if (!library) {
        return problemResponse(c, {
          status: 404,
          detail: '서재를 찾을 수 없어요',
          headers: { 'Cache-Control': privateCacheControl },
        })
      }

      if (scope === 'me' && library.isPublic === false && shouldBlockAdultGate(c)) {
        return adultVerificationRequiredResponse(c)
      }

      const fetchedItems = await selectLibraryItem({
        libraryId,
        limit: limit + 1,
        sort: isPublicScope ? DEFAULT_COLLECTION_ITEM_SORT : sort,
        ...(cursorData && {
          cursorMangaId: cursorData.mangaId,
          cursorTime: new Date(cursorData.timestamp),
        }),
      })

      const hasNextPage = fetchedItems.length > limit
      const pageItems = hasNextPage ? fetchedItems.slice(0, limit) : fetchedItems
      const catalogMangaMap = await getCatalogMangaMap(pageItems.map(({ mangaId }) => mangaId))

      const items = pageItems.map((item) => ({
        mangaId: item.mangaId,
        createdAt: item.createdAt.getTime(),
        manga: catalogMangaMap.get(item.mangaId),
      }))

      const lastItem = items[items.length - 1]
      const nextCursor = hasNextPage && lastItem ? getNextCollectionItemCursor(pageItems[pageItems.length - 1]) : null
      const result = { items, nextCursor }
      const cacheControl = isPublicScope ? sharedCacheControl : privateCacheControl

      return c.json<GETLibraryItemsResponse>(result, { headers: { 'Cache-Control': cacheControl } })
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500, detail: '서재 작품을 불러오지 못했어요' })
    }
  },
)

export default routes
