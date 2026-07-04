import type { GETV1PostLikedResponse } from '@litomi/contracts'

import { db } from '@litomi/db/app'
import { postLikeTable } from '@litomi/db/app/post'
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
    } satisfies GETV1PostLikedResponse

    return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
