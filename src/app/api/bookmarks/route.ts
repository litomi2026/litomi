import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { cookies } from 'next/headers'

export type ResponseApiBookmark = {
  mangaIds: number[]
}

export async function GET() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return new Response(null, { status: 401 })
  }

  const rows = await selectBookmarks({ userId })

  if (rows.length === 0) {
    return new Response(null, { status: 404 })
  }

  return Response.json({ mangaIds: rows.map((row) => row.mangaId) } satisfies ResponseApiBookmark)
}
