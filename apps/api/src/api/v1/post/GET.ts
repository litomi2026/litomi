import type { GETV1PostResponse } from '@litomi/contracts'

import { getV1PostQuerySchema } from '@litomi/contracts'
import selectPost from '@litomi/db/query/post'
import { decodePostCursor, encodePostCursor } from '@litomi/domain/common/cursor'
import { PostFilter } from '@litomi/domain/post/filter'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.get('/', zProblemValidator('query', getV1PostQuerySchema), async (c) => {
  const { cursor, limit, mangaId, filter, username } = c.req.valid('query')
  const decodedCursor = cursor ? decodePostCursor(cursor) : null
  const currentUserId = c.get('userId')

  if (cursor && !decodedCursor) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
  }

  if (filter === PostFilter.FOLLOWING && !currentUserId) {
    return problemResponse(c, { status: 401, detail: '로그인 정보가 없거나 만료됐어요' })
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
  const lastPost = posts[posts.length - 1]
  const nextCursor = hasNextPage && lastPost ? encodePostCursor(lastPost.createdAt.getTime(), lastPost.id) : null
  const cacheControl = getPostListCacheControl({ cursor, filter })

  return c.json<GETV1PostResponse>({ posts, nextCursor }, { headers: { 'Cache-Control': cacheControl } })
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
