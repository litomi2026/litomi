'use server'

import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { BookmarkSource } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'

const schema = z.object({
  mangaId: z.number(),
  source: z.enum(BookmarkSource),
})

export default async function bookmarkManga(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)
  if (!userId) return { status: 401, error: '로그인 정보가 없거나 만료됐어요.' }

  const validatedFields = schema.safeParse({
    mangaId: +(formData.get('mangaId')?.toString() ?? ''),
    source: +(formData.get('source')?.toString() ?? ''),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { mangaId, source } = validatedFields.data

  const [result] = await db.execute(sql`
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
    RETURNING manga_id
  `)

  return { success: true, isBookmarked: Boolean(result) }
}
