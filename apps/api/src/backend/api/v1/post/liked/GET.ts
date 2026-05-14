import { db } from '@litomi/db/database/supabase/drizzle'
import 'server-only'
import { postLikeTable } from '@litomi/db/database/supabase/post'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'

export type GETV1PostLikedResponse = {
  postIds: number[]
}

const route = new Hono<Env>()

route.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  try {
    const likedPostRows = await db
      .select({ postId: postLikeTable.postId })
      .from(postLikeTable)
      .where(eq(postLikeTable.userId, userId))

    const response = {
      postIds: likedPostRows.map(({ postId }) => postId),
    }

    return c.json<GETV1PostLikedResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '좋아요한 글 목록을 불러오지 못했어요' })
  }
})

export default route
