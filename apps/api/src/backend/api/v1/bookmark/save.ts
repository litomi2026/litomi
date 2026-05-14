import { and, count, eq, inArray } from 'drizzle-orm'

import { bookmarkTable } from '@/database/supabase/activity'

import { type BookmarkTx, getBookmarkLimit } from './limit'

type BookmarkSaveInput = {
  mangaId: number
  createdAt?: Date
}

type SaveBookmarksResult = {
  createdMangaIds: number[]
  duplicateCount: number
  overflowCount: number
}

export class BookmarkLimitReachedError extends Error {
  constructor() {
    super('BOOKMARK_LIMIT_REACHED')
  }
}

export async function saveBookmarks(
  tx: BookmarkTx,
  userId: number,
  entries: BookmarkSaveInput[],
): Promise<SaveBookmarksResult> {
  const uniqueEntries = dedupeBookmarkEntries(entries)

  if (uniqueEntries.length === 0) {
    return {
      createdMangaIds: [],
      duplicateCount: 0,
      overflowCount: 0,
    }
  }

  const existingRows = await tx
    .select({ mangaId: bookmarkTable.mangaId })
    .from(bookmarkTable)
    .where(
      and(
        eq(bookmarkTable.userId, userId),
        inArray(
          bookmarkTable.mangaId,
          uniqueEntries.map(({ mangaId }) => mangaId),
        ),
      ),
    )

  const existingIds = new Set(existingRows.map(({ mangaId }) => mangaId))
  const newEntries = uniqueEntries.filter(({ mangaId }) => !existingIds.has(mangaId))
  const duplicateCount = uniqueEntries.length - newEntries.length

  if (newEntries.length === 0) {
    return {
      createdMangaIds: [],
      duplicateCount,
      overflowCount: 0,
    }
  }

  const limit = await getBookmarkLimit(tx, userId)

  const [{ count: currentCount }] = await tx
    .select({ count: count(bookmarkTable.mangaId) })
    .from(bookmarkTable)
    .where(eq(bookmarkTable.userId, userId))

  const availableSlots = Math.max(limit - Number(currentCount), 0)

  if (availableSlots <= 0) {
    throw new BookmarkLimitReachedError()
  }

  const insertableEntries = newEntries.slice(0, availableSlots)
  const overflowCount = Math.max(newEntries.length - insertableEntries.length, 0)

  if (insertableEntries.length === 0) {
    return {
      createdMangaIds: [],
      duplicateCount,
      overflowCount,
    }
  }

  await tx
    .insert(bookmarkTable)
    .values(
      insertableEntries.map(({ mangaId, createdAt }) => ({
        userId,
        mangaId,
        ...(createdAt ? { createdAt } : {}),
      })),
    )
    .returning({ mangaId: bookmarkTable.mangaId })

  return {
    createdMangaIds: insertableEntries.map(({ mangaId }) => mangaId),
    duplicateCount,
    overflowCount,
  }
}

function dedupeBookmarkEntries(entries: readonly BookmarkSaveInput[]) {
  const seen = new Set<number>()
  const uniqueEntries: BookmarkSaveInput[] = []

  for (const entry of entries) {
    if (seen.has(entry.mangaId)) {
      continue
    }

    seen.add(entry.mangaId)
    uniqueEntries.push(entry)
  }

  return uniqueEntries
}
