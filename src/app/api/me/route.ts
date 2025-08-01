import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'

export type GETMeResponse = {
  id: number
  loginId: string
  name: string
  nickname: string
  imageURL: string | null
}

export async function GET() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
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
    .where(sql`${userTable.id} = ${userId}`)

  if (!user) {
    cookieStore.delete(CookieKey.ACCESS_TOKEN)
    return new Response('Not Found', { status: 404 })
  }

  return Response.json(user satisfies GETMeResponse)
}
