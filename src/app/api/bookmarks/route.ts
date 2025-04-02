import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { bookmarkTable } from '@/database/schema'
import { TokenType, verifyJWT } from '@/utils/jwt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

export type ResponseApiBookmark = {
  mangaIds: number[]
}

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value ?? ''
  const { sub: userId } = await verifyJWT(accessToken, TokenType.ACCESS).catch(() => ({ sub: null }))

  if (!userId) {
    return new Response(null, { status: 401 })
  }

  const rows = await db
    .select({ mangaId: bookmarkTable.mangaId })
    .from(bookmarkTable)
    .where(sql`${bookmarkTable.userId} = ${userId}`)

  if (rows.length === 0) {
    return new Response(null, { status: 404 })
  }

  return Response.json({ mangaIds: rows.map((row) => row.mangaId) } satisfies ResponseApiBookmark)
}
