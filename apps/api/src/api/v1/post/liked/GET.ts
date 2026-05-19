import type { GETV1PostLikedResponse } from '@litomi/contracts'

import { db } from '@litomi/db/database/app/drizzle'
import { postLikeTable } from '@litomi/db/database/app/post'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

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
