'use server'

import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { TokenType, verifyJWT } from '@/utils/jwt'
import { validatePositiveNumber } from '@/utils/param'
import { sql } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'

const schema = z.object({
  mangaId: z.number().min(1, '최소 1 이상이어야 합니다.'),
  userId: z.number().min(1, '최소 1 이상이어야 합니다.').max(Number.MAX_SAFE_INTEGER, '최대값을 초과했습니다.'),
})

export default async function bookmarkManga(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value ?? ''
  const { sub } = await verifyJWT(accessToken, TokenType.ACCESS).catch(() => ({ sub: null }))

  const validatedFields = schema.safeParse({
    mangaId: validatePositiveNumber(formData.get('mangaId') as string),
    userId: validatePositiveNumber(sub),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { mangaId, userId } = validatedFields.data

  const [result] = await db.execute(sql`
    WITH deleted AS (
      DELETE FROM bookmark
      WHERE manga_id = ${mangaId} AND user_id = ${userId}
      RETURNING manga_id
    )
    INSERT INTO bookmark (manga_id, user_id)
    SELECT ${mangaId}, ${userId}
    WHERE NOT EXISTS (
      SELECT 1 FROM deleted
    )
    RETURNING manga_id
  `)

  revalidateTag(`${userId}-bookmarks`)

  return { success: true, isBookmarked: Boolean(result) }
}
