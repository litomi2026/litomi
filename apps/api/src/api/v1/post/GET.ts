import type { GETV1PostResponse } from '@litomi/contracts'

import { getV1PostQuerySchema } from '@litomi/contracts'
import selectPost from '@litomi/db/app/query/post'
import { decodePostCursor, encodePostCursor } from '@litomi/db/cursor'
import { PostFilter } from '@litomi/domain/post/filter'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { getCatalogMangaMap } from '@/utils/catalog-manga'
import { authRequiredProblemResponse, problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('query', getV1PostQuerySchema))

route.get('/', ...middlewares, async (c) => {
  const { cursor, limit, locale, mangaId, filter, username } = c.req.valid('query')
  const decodedCursor = cursor ? decodePostCursor(cursor) : null
  const currentUserId = c.get('userId')

  if (cursor && !decodedCursor) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
  }

  if (filter === PostFilter.FOLLOWING && !currentUserId) {
    return authRequiredProblemResponse(c)
  }

  const postRows = await selectPost({
    limit: limit + 1,
    cursorId: decodedCursor?.id,
    cursorCreatedAt: decodedCursor ? new Date(decodedCursor.timestamp) : undefined,
    mangaId,
    filter,
    username,
    currentUserId,
  })

  const hasNextPage = postRows.length > limit
  const posts = hasNextPage ? postRows.slice(0, limit) : postRows
  const mangaIds: number[] = []

  for (const post of posts) {
    if (post.mangaId) {
      mangaIds.push(post.mangaId)
    }
  }

  const catalogMangaMap = mangaIds.length > 0 ? await getCatalogMangaMap(mangaIds, locale) : new Map()
  const lastPost = posts[posts.length - 1]
  const nextCursor = hasNextPage && lastPost ? encodePostCursor(lastPost.createdAt.getTime(), lastPost.id) : null
  const cacheControl = getPostListCacheControl({ cursor, filter })

  const result = {
    posts: posts.map((post) => ({
      ...post,
      manga: post.mangaId ? catalogMangaMap.get(post.mangaId) : undefined,
    })),
    nextCursor,
  } satisfies GETV1PostResponse

  return c.json(result, { headers: { 'Cache-Control': cacheControl } })
})

export default route

function getPostListCacheControl({ cursor, filter }: { cursor?: string; filter?: PostFilter }) {
  if (filter === PostFilter.FOLLOWING) {
    return privateCacheControl
  }

  if (cursor) {
    return createCacheControl({
      public: true,
      maxAge: sec('5 minutes'),
      sMaxAge: sec('1 day'),
      swr: sec('1 hour'),
    })
  }

  return createCacheControl({
    public: true,
    maxAge: 3,
    sMaxAge: sec('1 minute'),
    swr: sec('1 hour'),
  })
}
