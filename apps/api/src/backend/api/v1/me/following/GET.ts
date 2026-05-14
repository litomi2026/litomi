import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { db } from '@/database/supabase/drizzle'
import { userFollowTable } from '@/database/supabase/user'

export type GETV1MeFollowingResponse = {
  userIds: number[]
}

const route = new Hono<Env>()

route.get('/', async (c) => {
  const userId = c.get('userId')!

  try {
    const followingRows = await db
      .select({ userId: userFollowTable.followeeId })
      .from(userFollowTable)
      .where(eq(userFollowTable.followerId, userId))

    const response = {
      userIds: followingRows.map(({ userId: followeeId }) => followeeId),
    }

    return c.json<GETV1MeFollowingResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '팔로우한 사용자 목록을 불러오지 못했어요' })
  }
})

export default route
