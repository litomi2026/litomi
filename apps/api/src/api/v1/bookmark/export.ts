import { selectBookmark } from '@litomi/db/sql/selectBookmark'
import 'server-only'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

export type ExportBookmark = {
  mangaId: number
  createdAt: number
}

export type GETV1BookmarkExportResponse = {
  bookmarks: ExportBookmark[]
}

const route = new Hono<Env>()

route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  try {
    const bookmarkRows = await selectBookmark({ userId })

    const response = {
      bookmarks: bookmarkRows.map(({ mangaId, createdAt }) => ({
        mangaId,
        createdAt: createdAt.getTime(),
      })),
    }

    return c.json<GETV1BookmarkExportResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 내보내기 목록을 불러오지 못했어요' })
  }
})

export default route
