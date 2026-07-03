import type { GETV1BookmarkExportResponse } from '@litomi/contracts'

import { selectBookmark } from '@litomi/db/app/query/bookmark'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()

route.get('/', requireAuth, async (c) => {
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
    return problemResponse(c, { status: 500, detail: '북마크 내보내기 목록을 불러오지 못했어요' })
  }
})

export default route
