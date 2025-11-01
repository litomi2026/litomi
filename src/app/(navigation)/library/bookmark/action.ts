'use server'

import { sql } from 'drizzle-orm'
import { z } from 'zod'

import { MAX_BOOKMARKS_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { bookmarkTable } from '@/database/supabase/schema'
import { badRequest, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { formatNumber } from '@/utils/format'

type BookmarkResult = {
  mangaId: number
  createdAt: Date | null
  bookmarkCount: number
}

const schema = z.object({
  mangaId: z.coerce.number().int().positive(),
})

export default async function toggleBookmark(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = schema.safeParse({ mangaId: formData.get('mangaId') })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { mangaId } = validation.data

  const [{ bookmarkCount, createdAt }] = await db.execute<BookmarkResult>(sql`
    WITH 
    deleted AS (
      DELETE FROM ${bookmarkTable}
      WHERE ${bookmarkTable.mangaId} = ${mangaId} AND ${bookmarkTable.userId} = ${userId}
      RETURNING ${bookmarkTable.mangaId}
    ),
    current_count AS (
      SELECT COUNT(${bookmarkTable.mangaId}) as count
      FROM ${bookmarkTable}
      WHERE ${bookmarkTable.userId} = ${userId}
    ),
    inserted AS (
      INSERT INTO ${bookmarkTable} (manga_id, user_id)
      SELECT ${mangaId}, ${userId}
      WHERE NOT EXISTS (SELECT 1 FROM deleted)
        AND (SELECT count FROM current_count) < ${MAX_BOOKMARKS_PER_USER}
      RETURNING ${bookmarkTable.mangaId} as "mangaId", ${bookmarkTable.createdAt} as "createdAt"
    )
    SELECT 
      i."mangaId",
      i."createdAt",
      c.count as "bookmarkCount"
    FROM inserted i
    CROSS JOIN current_count c
    UNION ALL
    SELECT 
      NULL as "mangaId",
      NULL as "createdAt",
      c.count as "bookmarkCount"
    FROM current_count c
    WHERE NOT EXISTS (SELECT 1 FROM inserted)
  `)

  if (bookmarkCount >= MAX_BOOKMARKS_PER_USER) {
    return badRequest(`북마크는 최대 ${formatNumber(MAX_BOOKMARKS_PER_USER)}개까지 저장할 수 있어요`)
  }

  return ok({ mangaId, createdAt })
}
