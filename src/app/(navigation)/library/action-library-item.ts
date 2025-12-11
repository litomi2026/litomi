'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq, exists, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { MAX_ITEMS_PER_LIBRARY } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/schema'
import { badRequest, forbidden, internalServerError, notFound, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { addMangaToLibrariesSchema, bulkCopySchema, bulkMoveSchema, bulkRemoveSchema } from './schema'

const LibraryItemError = {
  NOT_FOUND: 'NOT_FOUND',
  LIBRARY_FULL: 'LIBRARY_FULL',
  NO_VALID_LIBRARIES: 'NO_VALID_LIBRARIES',
  NO_NEW_MANGA: 'NO_NEW_MANGA',
  NO_SOURCE_ITEMS: 'NO_SOURCE_ITEMS',
  NO_MOVABLE_ITEMS: 'NO_MOVABLE_ITEMS',
} as const

export async function addMangaToLibraries(data: { mangaId: number; libraryIds: number[] }) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = addMangaToLibrariesSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { mangaId, libraryIds } = validation.data

  try {
    const result = await db.transaction(async (tx) => {
      // 1. 대상 서재들 락 (소유권 확인 포함)
      const libraries = await tx
        .select({ id: libraryTable.id })
        .from(libraryTable)
        .where(and(eq(libraryTable.userId, userId), inArray(libraryTable.id, libraryIds)))
        .for('update')

      if (libraries.length === 0) {
        throw new Error(LibraryItemError.NOT_FOUND)
      }

      // 2. 각 서재별 아이템 수 조회
      const lockedLibraryIds = libraries.map((lib) => lib.id)
      const itemCounts = await tx
        .select({
          libraryId: libraryItemTable.libraryId,
          count: sql<number>`COUNT(*)`,
        })
        .from(libraryItemTable)
        .where(inArray(libraryItemTable.libraryId, lockedLibraryIds))
        .groupBy(libraryItemTable.libraryId)

      const countMap = new Map(itemCounts.map((ic) => [ic.libraryId, Number(ic.count)]))

      // 3. 이미 존재하는 manga 확인
      const existingItems = await tx
        .select({ libraryId: libraryItemTable.libraryId })
        .from(libraryItemTable)
        .where(and(inArray(libraryItemTable.libraryId, lockedLibraryIds), eq(libraryItemTable.mangaId, mangaId)))

      const existingSet = new Set(existingItems.map((item) => item.libraryId))

      // 4. 추가 가능한 서재 필터링 (중복 없음 + 용량 여유)
      const validLibraryIds = lockedLibraryIds.filter((libId) => {
        if (existingSet.has(libId)) return false
        const currentCount = countMap.get(libId) ?? 0
        return currentCount < MAX_ITEMS_PER_LIBRARY
      })

      if (validLibraryIds.length === 0) {
        throw new Error(LibraryItemError.NO_VALID_LIBRARIES)
      }

      // 5. INSERT
      const inserted = await tx
        .insert(libraryItemTable)
        .values(validLibraryIds.map((libraryId) => ({ libraryId, mangaId })))
        .returning({ libraryId: libraryItemTable.libraryId })

      return inserted
    })

    for (const { libraryId } of result) {
      revalidatePath(`/library/${libraryId}`, 'page')
    }

    return ok(result.length)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === LibraryItemError.NOT_FOUND) {
        return notFound('서재를 찾을 수 없어요')
      }
      if (error.message === LibraryItemError.NO_VALID_LIBRARIES) {
        return forbidden('이미 모든 서재에 있거나 서재가 가득 찼어요')
      }
    }
    captureException(error)
    return internalServerError('서재에 작품을 추가하지 못했어요')
  }
}

export async function bulkCopyToLibrary(data: { toLibraryId: number; mangaIds: number[] }) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = bulkCopySchema.safeParse({
    toLibraryId: data.toLibraryId,
    mangaIds: data.mangaIds,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { toLibraryId, mangaIds } = validation.data

  try {
    const result = await db.transaction(async (tx) => {
      // 1. 서재 락 (소유권 확인 포함)
      const [library] = await tx
        .select({ id: libraryTable.id })
        .from(libraryTable)
        .where(and(eq(libraryTable.userId, userId), eq(libraryTable.id, toLibraryId)))
        .for('update')

      if (!library) {
        throw new Error(LibraryItemError.NOT_FOUND)
      }

      // 2. 현재 아이템 수 조회
      const [{ count }] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(libraryItemTable)
        .where(eq(libraryItemTable.libraryId, toLibraryId))

      const currentCount = Number(count)
      const availableSlots = MAX_ITEMS_PER_LIBRARY - currentCount

      if (availableSlots <= 0) {
        throw new Error(LibraryItemError.LIBRARY_FULL)
      }

      // 3. 이미 존재하는 manga 필터링
      const existingItems = await tx
        .select({ mangaId: libraryItemTable.mangaId })
        .from(libraryItemTable)
        .where(and(eq(libraryItemTable.libraryId, toLibraryId), inArray(libraryItemTable.mangaId, mangaIds)))

      const existingMangaIds = new Set(existingItems.map((item) => item.mangaId))
      const newMangaIds = mangaIds.filter((id) => !existingMangaIds.has(id)).slice(0, availableSlots)

      if (newMangaIds.length === 0) {
        throw new Error(LibraryItemError.NO_NEW_MANGA)
      }

      // 4. INSERT
      const inserted = await tx
        .insert(libraryItemTable)
        .values(newMangaIds.map((mangaId) => ({ libraryId: toLibraryId, mangaId })))
        .returning({ mangaId: libraryItemTable.mangaId })

      return inserted
    })

    revalidatePath(`/library/${data.toLibraryId}`, 'page')
    return ok(result.length)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === LibraryItemError.NOT_FOUND) {
        return notFound('서재를 찾을 수 없어요')
      }
      if (error.message === LibraryItemError.LIBRARY_FULL) {
        return forbidden('서재가 가득 찼어요')
      }
      if (error.message === LibraryItemError.NO_NEW_MANGA) {
        return forbidden('이미 서재에 있는 작품이에요')
      }
    }
    captureException(error)
    return internalServerError('서재에 작품을 복사하지 못했어요')
  }
}

export async function bulkMoveToLibrary(data: { fromLibraryId: number; toLibraryId: number; mangaIds: number[] }) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = bulkMoveSchema.safeParse({
    fromLibraryId: data.fromLibraryId,
    toLibraryId: data.toLibraryId,
    mangaIds: data.mangaIds,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { fromLibraryId, toLibraryId, mangaIds } = validation.data

  try {
    const result = await db.transaction(async (tx) => {
      // 1. 두 서재 락 (일관된 순서로 락하여 데드락 방지)
      const [minId, maxId] = fromLibraryId < toLibraryId ? [fromLibraryId, toLibraryId] : [toLibraryId, fromLibraryId]

      const libraries = await tx
        .select({ id: libraryTable.id })
        .from(libraryTable)
        .where(and(eq(libraryTable.userId, userId), inArray(libraryTable.id, [minId, maxId])))
        .orderBy(libraryTable.id)
        .for('update')

      if (libraries.length !== 2) {
        throw new Error(LibraryItemError.NOT_FOUND)
      }

      // 2. 대상 서재 아이템 수 조회
      const [{ count }] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(libraryItemTable)
        .where(eq(libraryItemTable.libraryId, toLibraryId))

      const currentCount = Number(count)
      const availableSlots = MAX_ITEMS_PER_LIBRARY - currentCount

      if (availableSlots <= 0) {
        throw new Error(LibraryItemError.LIBRARY_FULL)
      }

      // 3. 이동 가능한 항목 조회 (출발 서재에 있고 + 도착 서재에 없는 것)
      const sourceItems = await tx
        .select({ mangaId: libraryItemTable.mangaId })
        .from(libraryItemTable)
        .where(and(eq(libraryItemTable.libraryId, fromLibraryId), inArray(libraryItemTable.mangaId, mangaIds)))

      const sourceMangaIds = sourceItems.map((item) => item.mangaId)

      if (sourceMangaIds.length === 0) {
        throw new Error(LibraryItemError.NO_SOURCE_ITEMS)
      }

      const existingInTarget = await tx
        .select({ mangaId: libraryItemTable.mangaId })
        .from(libraryItemTable)
        .where(and(eq(libraryItemTable.libraryId, toLibraryId), inArray(libraryItemTable.mangaId, sourceMangaIds)))

      const existingSet = new Set(existingInTarget.map((item) => item.mangaId))
      const movableMangaIds = sourceMangaIds.filter((id) => !existingSet.has(id)).slice(0, availableSlots)

      if (movableMangaIds.length === 0) {
        throw new Error(LibraryItemError.NO_MOVABLE_ITEMS)
      }

      // 4. DELETE from source
      await tx
        .delete(libraryItemTable)
        .where(and(eq(libraryItemTable.libraryId, fromLibraryId), inArray(libraryItemTable.mangaId, movableMangaIds)))

      // 5. INSERT to target
      const inserted = await tx
        .insert(libraryItemTable)
        .values(movableMangaIds.map((mangaId) => ({ libraryId: toLibraryId, mangaId })))
        .returning({ mangaId: libraryItemTable.mangaId })

      return inserted
    })

    revalidatePath(`/library/${data.fromLibraryId}`, 'page')
    revalidatePath(`/library/${data.toLibraryId}`, 'page')
    return ok(result.length)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === LibraryItemError.NOT_FOUND) {
        return notFound('서재를 찾을 수 없어요')
      }
      if (error.message === LibraryItemError.LIBRARY_FULL) {
        return forbidden('대상 서재가 가득 찼어요')
      }
      if (error.message === LibraryItemError.NO_SOURCE_ITEMS) {
        return forbidden('이동할 작품을 찾을 수 없어요')
      }
      if (error.message === LibraryItemError.NO_MOVABLE_ITEMS) {
        return forbidden('이미 대상 서재에 있는 작품이에요')
      }
    }
    captureException(error)
    return internalServerError('서재에 작품을 이동하지 못했어요')
  }
}

export async function bulkRemoveFromLibrary(data: { libraryId: number; mangaIds: number[] }) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = bulkRemoveSchema.safeParse({
    libraryId: data.libraryId,
    mangaIds: data.mangaIds,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { libraryId, mangaIds } = validation.data

  try {
    const result = await db
      .delete(libraryItemTable)
      .where(
        and(
          eq(libraryItemTable.libraryId, libraryId),
          inArray(libraryItemTable.mangaId, mangaIds),
          exists(
            db
              .select()
              .from(libraryTable)
              .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId))),
          ),
        ),
      )
      .returning({ mangaId: libraryItemTable.mangaId })

    if (result.length === 0) {
      return forbidden('삭제할 작품을 찾을 수 없어요')
    }

    revalidatePath(`/library/${libraryId}`, 'page')
    return ok(result.length)
  } catch (error) {
    captureException(error)
    return internalServerError('서재에서 작품을 삭제하지 못했어요')
  }
}
