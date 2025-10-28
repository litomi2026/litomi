import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/schema'
import { validateUserIdFromCookie } from '@/utils/cookie'

export type GETMeResponse = {
  id: number
  loginId: string
  name: string
  nickname: string
  imageURL: string | null
}

export async function GET(request: Request) {
  const userId = await validateUserIdFromCookie()

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 3,
  })

  if (!userId) {
    return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': cacheControl } })
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
      const cookieStore = await cookies()
      cookieStore.delete({ name: CookieKey.ACCESS_TOKEN, domain: COOKIE_DOMAIN })
      cookieStore.delete({ name: CookieKey.REFRESH_TOKEN, domain: COOKIE_DOMAIN })
      return new Response('Not Found', { status: 404, headers: { 'Cache-Control': cacheControl } })
    }

    return Response.json(user satisfies GETMeResponse, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
