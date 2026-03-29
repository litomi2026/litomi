import { eq } from 'drizzle-orm'
import 'server-only'
import { Hono } from 'hono'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { db } from '@/database/supabase/drizzle'
import { postLikeTable } from '@/database/supabase/post'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

export type GETV1PostLikedResponse = {
  postIds: number[]
}

const route = new Hono<Env>()

const privateLikedPostsCacheControl = createCacheControl({
  private: true,
  maxAge: sec('1 day'),
})

route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  try {
    const likedPostRows = await db
      .select({ postId: postLikeTable.postId })
      .from(postLikeTable)
      .where(eq(postLikeTable.userId, userId))

    const response = { postIds: likedPostRows.map(({ postId }) => postId) }

    return c.json<GETV1PostLikedResponse>(response, { headers: { 'Cache-Control': privateLikedPostsCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '좋아요한 글 목록을 불러오지 못했어요' })
  }
})

export default route
