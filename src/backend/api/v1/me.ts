import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'
import 'server-only'

import { Env } from '@/backend'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { CookieKey } from '@/constants/storage'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'

export type GETV1MeResponse = {
  id: number
  loginId: string
  name: string
  nickname: string
  imageURL: string | null
}

const meRoutes = new Hono<Env>()

meRoutes.get('/', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  try {
    const [user] = await db
      .select({
        id: userTable.id,
        loginId: userTable.loginId,
        name: userTable.name,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))

    if (!user) {
      deleteCookie(c, CookieKey.ACCESS_TOKEN)
      deleteCookie(c, CookieKey.REFRESH_TOKEN)
      return problemResponse(c, { status: 404, detail: '사용자 정보를 찾을 수 없어요' })
    }
    return c.json<GETV1MeResponse>(user, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '사용자 정보를 불러오지 못했어요' })
  }
})

export default meRoutes
