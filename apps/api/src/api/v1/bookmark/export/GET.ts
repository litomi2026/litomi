import type { GETV1BookmarkExportResponse } from '@litomi/contracts'

import { selectBookmark } from '@litomi/db/app/query/bookmark'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!

  try {
    const bookmarkRows = await selectBookmark(userId)

    const response = {
      bookmarks: bookmarkRows.map(({ mangaId, createdAt }) => ({
        mangaId,
        createdAt: createdAt.getTime(),
      })),
    } satisfies GETV1BookmarkExportResponse

    return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
