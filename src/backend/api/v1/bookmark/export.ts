import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { selectBookmark } from '@/sql/selectBookmark'

export type ExportBookmark = {
  mangaId: number
  createdAt: number
}

export type GETV1BookmarkExportResponse = {
  bookmarks: ExportBookmark[]
}

const route = new Hono<Env>()

route.get('/', requireAuth, requireAdult, async (c) => {
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
