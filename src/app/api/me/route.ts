import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { TokenType, verifyJWT } from '@/utils/jwt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value ?? ''
  const { sub: userId } = await verifyJWT(accessToken, TokenType.ACCESS).catch(() => ({ sub: null }))

  if (!userId) {
    return new Response(null, { status: 401 })
  }

  const [user] = await db
    .select({
      id: userTable.id,
      loginId: userTable.loginId,
      nickname: userTable.nickname,
    })
    .from(userTable)
    .where(sql`${userTable.id} = ${userId}`)

  if (!user) {
    return new Response(null, { status: 404 })
  }

  return Response.json(user)
}
