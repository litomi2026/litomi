import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { selectBookmarkId } from '@/sql/selectBookmark'

export type GETV1BookmarkIdResponse = {
  mangaIds: number[]
}

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
