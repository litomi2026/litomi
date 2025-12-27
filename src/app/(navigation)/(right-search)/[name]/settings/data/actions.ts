'use server'

import { captureException } from '@sentry/nextjs'
import { compare } from 'bcrypt'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { bookmarkTable, readingHistoryTable, userRatingTable } from '@/database/supabase/activity'
import { userCensorshipTable } from '@/database/supabase/censorship'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'
import { userTable } from '@/database/supabase/user'
import { passwordSchema } from '@/database/zod'
import { badRequest, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'

const exportDataSchema = z.object({
  password: passwordSchema,
  includeHistory: z.boolean(),
  includeBookmarks: z.boolean(),
  includeRatings: z.boolean(),
  includeLibraries: z.boolean(),
  includeCensorships: z.boolean(),
})

export type DataCounts = {
  history: number
  bookmarks: number
  ratings: number
  libraries: number
  censorships: number
}

export type ExportDataInput = z.infer<typeof exportDataSchema>

export async function exportUserData(input: ExportDataInput) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = exportDataSchema.safeParse(input)

  if (!validation.success) {
    return badRequest('잘못된 요청이에요')
  }

  const { password, includeHistory, includeBookmarks, includeRatings, includeLibraries, includeCensorships } =
    validation.data

  try {
    const [user] = await db
      .select({ passwordHash: userTable.passwordHash })
      .from(userTable)
      .where(eq(userTable.id, userId))

    // NOTE: 타이밍 공격 방지
    const dummyHash = '$2b$10$dummyhashfortimingattackprevention'
    const isValidPassword = await compare(password, user?.passwordHash ?? dummyHash)

    if (!user || !isValidPassword) {
      return unauthorized('인증에 실패했어요')
    }

    // 선택된 데이터만 조회
    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
    }

    const [history, bookmarks, ratings, libraries, censorships] = await Promise.all([
      includeHistory &&
        db
          .select({
            mangaId: readingHistoryTable.mangaId,
            lastPage: readingHistoryTable.lastPage,
            updatedAt: readingHistoryTable.updatedAt,
          })
          .from(readingHistoryTable)
          .where(eq(readingHistoryTable.userId, userId)),
      includeBookmarks &&
        db
          .select({
            mangaId: bookmarkTable.mangaId,
            createdAt: bookmarkTable.createdAt,
          })
          .from(bookmarkTable)
          .where(eq(bookmarkTable.userId, userId)),
      includeRatings &&
        db
          .select({
            mangaId: userRatingTable.mangaId,
            rating: userRatingTable.rating,
            createdAt: userRatingTable.createdAt,
            updatedAt: userRatingTable.updatedAt,
          })
          .from(userRatingTable)
          .where(eq(userRatingTable.userId, userId)),
      includeLibraries &&
        db
          .select({
            id: libraryTable.id,
            name: libraryTable.name,
            description: libraryTable.description,
            icon: libraryTable.icon,
            color: libraryTable.color,
            isPublic: libraryTable.isPublic,
            createdAt: libraryTable.createdAt,
          })
          .from(libraryTable)
          .where(eq(libraryTable.userId, userId)),
      includeCensorships &&
        db
          .select({
            key: userCensorshipTable.key,
            value: userCensorshipTable.value,
            level: userCensorshipTable.level,
            createdAt: userCensorshipTable.createdAt,
          })
          .from(userCensorshipTable)
          .where(eq(userCensorshipTable.userId, userId)),
    ])

    if (history) {
      exportData.history = history
    }

    if (bookmarks) {
      exportData.bookmarks = bookmarks
    }

    if (ratings) {
      exportData.ratings = ratings
    }

    if (censorships) {
      exportData.censorships = censorships
    }

    if (libraries) {
      const libraryIds = libraries.map((l) => l.id)

      const allItems = await db
        .select({
          libraryId: libraryItemTable.libraryId,
          mangaId: libraryItemTable.mangaId,
          createdAt: libraryItemTable.createdAt,
        })
        .from(libraryItemTable)
        .where(inArray(libraryItemTable.libraryId, libraryIds))

      const itemsByLibraryId = Map.groupBy(allItems, (item) => item.libraryId)

      exportData.libraries = libraries.map((library) => ({
        name: library.name,
        description: library.description,
        icon: library.icon,
        color: library.color,
        isPublic: library.isPublic,
        createdAt: library.createdAt,
        items: (itemsByLibraryId.get(library.id) ?? []).map(({ mangaId, createdAt }) => ({ mangaId, createdAt })),
      }))
    }

    return ok(JSON.stringify(exportData, null, 2))
  } catch (error) {
    captureException(error)
    return internalServerError('데이터 내보내기 중 오류가 발생했어요')
  }
}
