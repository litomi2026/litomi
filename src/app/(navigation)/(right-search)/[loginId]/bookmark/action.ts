'use server'

import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { BookmarkSource } from '@/database/enum'
import { getUserIdFromAccessToken } from '@/utils/cookie'

type BookmarkResult = {
  mangaId: number
  createdAt: Date
}

const schema = z.object({
  mangaId: z.coerce.number().int().positive(),
  source: z.enum(BookmarkSource),
})

export default async function toggleBookmark(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return { status: 401, message: '로그인 정보가 없거나 만료됐어요' }
  }

  const validation = schema.safeParse({
    mangaId: formData.get('mangaId'),
    source: +(formData.get('source') ?? ''),
  })

  if (!validation.success) {
    return { status: 400, message: validation.error.issues[0].message }
  }

  const { mangaId, source } = validation.data

  const [result] = await db.execute<BookmarkResult>(sql`
    WITH deleted AS (
      DELETE FROM bookmark
      WHERE manga_id = ${mangaId} AND user_id = ${userId}
      RETURNING manga_id
    )
    INSERT INTO bookmark (manga_id, user_id, source)
    SELECT ${mangaId}, ${userId}, ${source}
    WHERE NOT EXISTS (
      SELECT 1 FROM deleted
    )
    RETURNING manga_id as mangaId, created_at as createdAt
  `)

  return { status: 200, data: result }
}
