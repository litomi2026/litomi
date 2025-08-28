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

import {
  addMangaToLibrariesSchema,
  bulkCopySchema,
  bulkMoveSchema,
  bulkRemoveSchema,
  createLibrarySchema,
  updateLibrarySchema,
} from './schema'

export async function addMangaToLibraries(data: { mangaId: number; libraryIds: number[] }) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = addMangaToLibrariesSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { mangaId, libraryIds } = validation.data

  const result = await db.execute<{ libraryId: number; mangaId: number; alreadyExists: boolean }>(sql`
    WITH user_libraries AS (
      SELECT ${libraryTable.id} 
      FROM ${libraryTable}
      WHERE ${libraryTable.userId} = ${userId} AND ${libraryTable.id} = ANY(ARRAY[${sql.join(libraryIds, sql`, `)}]::int[])
    )
    INSERT INTO ${libraryItemTable} (library_id, manga_id)
    SELECT id, ${mangaId}
    FROM user_libraries
    ON CONFLICT (library_id, manga_id) DO NOTHING
    RETURNING ${libraryItemTable.libraryId}, ${libraryItemTable.mangaId}
  `)

  for (const { libraryId } of result) {
    revalidatePath(`/library/${libraryId}`, 'page')
  }

  return ok(result.length)
}

export async function bulkCopyToLibrary(data: { toLibraryId: number; mangaIds: number[] }) {
  const userId = await getUserIdFromCookie()

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

  const validation = bulkMoveSchema.safeParse({
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
    isPublic: formData.get('is-public') === 'on',
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

export async function deleteLibrary(libraryId: number) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const [deletedLibrary] = await db
    .delete(libraryTable)
    .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, Number(userId))))
    .returning({ id: libraryTable.id })

  if (!deletedLibrary) {
    return notFound('서재를 찾을 수 없어요')
  }

  revalidatePath('/library', 'layout')
  return ok(deletedLibrary.id)
}

export async function updateLibrary(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = updateLibrarySchema.safeParse({
    libraryId: formData.get('library-id'),
    name: formData.get('name'),
    description: formData.get('description'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { libraryId, name, description, color, icon } = validation.data

  const [updatedLibrary] = await db
    .update(libraryTable)
    .set({
      name: name.trim(),
      description: description?.trim() || null,
      color: color ? hexColorToInt(color) : null,
      icon: icon || null,
    })
    .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, Number(userId))))
    .returning({ id: libraryTable.id })

  if (!updatedLibrary) {
    return notFound('서재를 찾을 수 없어요', formData)
  }

  revalidatePath('/library', 'layout')
  revalidatePath(`/library/${libraryId}`, 'page')
  return ok(updatedLibrary.id)
}
