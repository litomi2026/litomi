'use server'

import { captureException } from '@sentry/nextjs'
import { count, eq } from 'drizzle-orm'
import { z } from 'zod'

import { MAX_BOOKMARKS_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { bookmarkTable } from '@/database/supabase/schema'
import { badRequest, forbidden, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

export type ImportMode = 'merge' | 'replace'

export type ImportResult = {
  imported: number
  skipped: number
}

const importedBookmarkSchema = z.object({
  mangaId: z.number().int().positive(),
  createdAt: z.coerce.date().optional(),
})

const bookmarkImportSchema = z.array(importedBookmarkSchema).min(1).max(MAX_BOOKMARKS_PER_USER)

export type BookmarkImportData = z.infer<typeof bookmarkImportSchema>

export async function importBookmarks(data: BookmarkImportData, mode: ImportMode = 'merge') {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = bookmarkImportSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const bookmarks = validation.data

  try {
    const result = await db.transaction(async (tx) => {
      if (mode === 'replace') {
        const now = new Date()

        const newBookmarks = bookmarks.map((bookmark) => ({
          mangaId: bookmark.mangaId,
          userId,
          createdAt: bookmark.createdAt ?? now,
        }))

        await tx.delete(bookmarkTable).where(eq(bookmarkTable.userId, userId))
        await tx.insert(bookmarkTable).values(newBookmarks)

        return {
          imported: newBookmarks.length,
          skipped: 0,
        }
      } else {
        const [{ count: currentCount }] = await tx
          .select({ count: count(bookmarkTable.mangaId) })
          .from(bookmarkTable)
          .where(eq(bookmarkTable.userId, userId))

        if (currentCount >= MAX_BOOKMARKS_PER_USER) {
          return forbidden(`북마크 저장 한도에 도달했어요: ${MAX_BOOKMARKS_PER_USER}개`)
        }

        const availableSlots = MAX_BOOKMARKS_PER_USER - currentCount

        if (bookmarks.length > availableSlots) {
          return forbidden(`최대 ${availableSlots}개만 추가로 가져올 수 있어요: 현재 ${currentCount}개`)
        }

        const now = new Date()

        const newBookmarks = bookmarks.map((bookmark) => ({
          mangaId: bookmark.mangaId,
          userId,
          createdAt: bookmark.createdAt ?? now,
        }))

        const result = await tx
          .insert(bookmarkTable)
          .values(newBookmarks)
          .onConflictDoNothing()
          .returning({ mangaId: bookmarkTable.mangaId })

        return {
          imported: result.length,
          skipped: newBookmarks.length - result.length,
        }
      }
    })

    if ('error' in result) {
      return result
    }

    return ok<ImportResult>(result)
  } catch (error) {
    captureException(error, { extra: { name: 'importBookmarks', userId } })
    return internalServerError('북마크 가져오기 중 오류가 발생했어요')
  }
}
