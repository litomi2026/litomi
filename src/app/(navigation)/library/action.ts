'use server'

import { and, eq, exists, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { MAX_LIBRARIES_PER_USER } from '@/constants/policy'
import { db } from '@/database/drizzle'
import { libraryItemTable, libraryTable } from '@/database/schema'
import { badRequest, conflict, created, notFound, ok, unauthorized } from '@/utils/action-response'
import { hexColorToInt } from '@/utils/color'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { getUserIdFromCookie } from '@/utils/session'

import { addToLibrarySchema, bulkOperationSchema, bulkRemoveSchema, createLibrarySchema } from './schema'

export async function addMangaToLibrary(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = addToLibrarySchema.safeParse({
    libraryId: formData.get('libraryId'),
    mangaId: formData.get('mangaId'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { libraryId, mangaId } = validation.data

  const result = await db.execute<{ libraryId: number; mangaId: number }>(sql`
    INSERT INTO ${libraryItemTable} (library_id, manga_id)
    SELECT ${libraryId}, ${mangaId}
    WHERE EXISTS (
      SELECT 1 FROM ${libraryTable}
      WHERE id = ${libraryId} AND user_id = ${userId}
    )
    ON CONFLICT (library_id, manga_id) DO NOTHING
    RETURNING ${libraryItemTable.libraryId}, ${libraryItemTable.mangaId}
  `)

  if (result.length === 0) {
    // NOTE: 403 권한이 없는 경우일 수도 있지만 굳이 구분하지 않음
    return conflict('이미 추가된 작품이에요')
  }

  revalidatePath(`/library/${libraryId}`, 'page')
  return ok(true)
}

export async function bulkCopyToLibrary(data: { toLibraryId: number; mangaIds: number[] }) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = bulkOperationSchema.safeParse({
    toLibraryId: data.toLibraryId,
    mangaIds: data.mangaIds,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { toLibraryId, mangaIds } = validation.data

  const result = await db.execute<{ libraryId: number; mangaId: number }>(sql`
    INSERT INTO ${libraryItemTable} (library_id, manga_id)
    SELECT ${toLibraryId}, manga_id
    FROM (SELECT UNNEST(ARRAY[${sql.join(mangaIds, sql`, `)}]::int[]) AS manga_id)
    WHERE EXISTS (
      SELECT 1 FROM ${libraryTable}
      WHERE user_id = ${userId} AND id = ${toLibraryId}
    )
    ON CONFLICT (library_id, manga_id) DO NOTHING
    RETURNING ${libraryItemTable.libraryId}, ${libraryItemTable.mangaId}
  `)

  if (result.length === 0) {
    // NOTE: 403 권한이 없는 경우일 수도 있지만 굳이 구분하지 않음
    return conflict('이미 추가된 작품이에요')
  }

  revalidatePath(`/library/${data.toLibraryId}`, 'page')
  return ok(result.length)
}

export async function bulkMoveToLibrary(data: { fromLibraryId: number; toLibraryId: number; mangaIds: number[] }) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = bulkOperationSchema.safeParse({
    fromLibraryId: data.fromLibraryId,
    toLibraryId: data.toLibraryId,
    mangaIds: data.mangaIds,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { fromLibraryId, toLibraryId, mangaIds } = validation.data

  const result = await db.execute<{ libraryId: number; mangaId: number }>(sql`
    WITH verified_libraries AS (
      SELECT COUNT(${libraryTable.id}) as library_count
      FROM ${libraryTable}
      WHERE ${libraryTable.userId} = ${userId} 
        AND ${libraryTable.id} IN (${fromLibraryId}, ${toLibraryId})
    ),
    deleted_items AS (
      DELETE FROM ${libraryItemTable}
      WHERE ${libraryItemTable.libraryId} = ${fromLibraryId}
        AND ${libraryItemTable.mangaId} = ANY(ARRAY[${sql.join(mangaIds, sql`, `)}]::int[])
        AND (SELECT library_count FROM verified_libraries) = 2
      RETURNING ${libraryItemTable.mangaId}
    )
    INSERT INTO ${libraryItemTable} (library_id, manga_id)
    SELECT ${toLibraryId}, manga_id
    FROM deleted_items
    ON CONFLICT (library_id, manga_id) DO NOTHING
    RETURNING ${libraryItemTable.libraryId}, ${libraryItemTable.mangaId}
  `)

  if (result.length === 0) {
    // NOTE: 403 권한이 없는 경우일 수도 있지만 굳이 구분하지 않음
    return conflict('이미 추가된 작품이에요')
  }

  revalidatePath(`/library/${data.fromLibraryId}`, 'page')
  revalidatePath(`/library/${data.toLibraryId}`, 'page')
  return ok(result.length)
}

export async function bulkRemoveFromLibrary(data: { libraryId: number; mangaIds: number[] }) {
  const userId = await getUserIdFromCookie()

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
            .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, Number(userId)))),
        ),
      ),
    )
    .returning({ mangaId: libraryItemTable.mangaId })

  if (result.length === 0) {
    // NOTE: 403 권한이 없는 경우일 수도 있지만 굳이 구분하지 않음
    return notFound('해당 작품을 찾을 수 없어요')
  }

  revalidatePath(`/library/${libraryId}`, 'page')
  return ok(result.length)
}

export async function createLibrary(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = createLibrarySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    color: formData.get('color'),
    icon: formData.get('icon'),
    isPublic: formData.get('isPublic') === 'true',
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { name, description, color, icon, isPublic } = validation.data
  const userIdNum = Number(userId)

  const [newLibrary] = await db.execute<{ id: number }>(sql`
    INSERT INTO ${libraryTable} (user_id, name, description, color, icon, is_public)
    SELECT 
      ${userIdNum},
      ${name},
      ${description},
      ${color ? hexColorToInt(color) : null},
      ${icon},
      ${isPublic}
    WHERE (
      SELECT COUNT(${libraryTable.id}) FROM ${libraryTable} WHERE user_id = ${userIdNum}
    ) < ${MAX_LIBRARIES_PER_USER}
    RETURNING ${libraryTable.id}
  `)

  if (!newLibrary) {
    return badRequest('서재 생성에 실패했어요')
  }

  revalidatePath('/library', 'layout')
  return created(newLibrary.id)
}
