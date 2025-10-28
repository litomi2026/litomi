import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'

import { getUserId } from '@/backend/utils/auth'
import { CookieKey } from '@/constants/storage'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/schema'

import type { Env } from '../..'

export type GETV1MeResponse = {
  id: number
  loginId: string
  name: string
  nickname: string
  imageURL: string | null
}

const meRoutes = new Hono<Env>()

meRoutes.get('/', async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

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
    throw new HTTPException(404)
  }

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 3,
  })

  return c.json<GETV1MeResponse>(user, { headers: { 'Cache-Control': cacheControl } })
})

export default meRoutes
