import type { GETV1BookmarkIdResponse } from '@litomi/contracts'

import { selectBookmarkId } from '@litomi/db/app/query/bookmark'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'
import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, requireAdult)

route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!

  try {
    const bookmarkRows = await selectBookmarkId(userId)
    const response = { mangaIds: bookmarkRows.map(({ mangaId }) => mangaId) } satisfies GETV1BookmarkIdResponse

    return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
