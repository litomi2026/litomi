import type { GETV1BookmarkIdResponse } from '@litomi/contracts'

import { selectBookmarkId } from '@litomi/db/app/query/bookmark'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()

route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  try {
    const bookmarkRows = await selectBookmarkId({ userId })
    const response = { mangaIds: bookmarkRows.map(({ mangaId }) => mangaId) }
    return c.json<GETV1BookmarkIdResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 ID 목록을 불러오지 못했어요' })
  }
})

export default route
