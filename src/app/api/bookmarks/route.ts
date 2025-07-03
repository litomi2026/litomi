import { cookies } from 'next/headers'

import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'

export type ResponseApiBookmark = {
  mangaIds: number[]
}

export async function GET() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)
  if (!userId) return new Response('로그인 정보가 없거나 만료됐어요.', { status: 401 })

  const rows = await selectBookmarks({ userId })
  if (rows.length === 0) return new Response('북마크가 없어요', { status: 404 })

  return Response.json({ mangaIds: rows.map((row) => row.mangaId) } satisfies ResponseApiBookmark)
}
