import { db } from '@litomi/db/database/supabase/drizzle'
import { userFollowTable } from '@litomi/db/database/supabase/user'
import 'server-only'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

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
