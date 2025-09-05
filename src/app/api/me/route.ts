import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { CookieKey } from '@/constants/storage'
import { handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
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

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
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
      cookieStore.delete(CookieKey.ACCESS_TOKEN)
      return new Response('Not Found', { status: 404 })
    }

    return Response.json(user satisfies GETMeResponse)
  } catch (error) {
    return handleRouteError(error, request)
  }
}
