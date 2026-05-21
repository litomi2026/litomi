import { postV1MeExportBodySchema, type POSTV1MeExportResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { bookmarkTable, readingHistoryTable, userRatingTable } from '@litomi/db/app/activity'
import { userCensorshipTable } from '@litomi/db/app/censorship'
import { libraryItemTable, libraryTable } from '@litomi/db/app/library'
import { userTable } from '@litomi/db/app/user'
import { compare } from 'bcryptjs'
import { eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1MeExportBodySchema), async (c) => {
  const userId = c.get('userId')!

  const { password, includeHistory, includeBookmarks, includeRatings, includeLibraries, includeCensorships } =
    c.req.valid('json')

  try {
    const [user] = await db
      .select({ passwordHash: userTable.passwordHash })
      .from(userTable)
      .where(eq(userTable.id, userId))

    const dummyHash = '$2b$10$dummyhashfortimingattackprevention'
    const isValidPassword = await compare(password, user?.passwordHash ?? dummyHash)

    if (!user || !isValidPassword) {
      return problemResponse(c, { status: 401, detail: '인증에 실패했어요' })
    }

    const exportData: POSTV1MeExportResponse = {
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
      const libraryIds = libraries.map((library) => library.id)

      const allItems =
        libraryIds.length > 0
          ? await db
              .select({
                libraryId: libraryItemTable.libraryId,
                mangaId: libraryItemTable.mangaId,
                createdAt: libraryItemTable.createdAt,
              })
              .from(libraryItemTable)
              .where(inArray(libraryItemTable.libraryId, libraryIds))
          : []

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

    return c.json<POSTV1MeExportResponse>(exportData)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '데이터 내보내기 중 오류가 발생했어요' })
  }
})

export default route
