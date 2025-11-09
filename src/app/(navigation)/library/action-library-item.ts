'use server'

import { and, eq, exists, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { MAX_ITEMS_PER_LIBRARY } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/schema'
import { badRequest, forbidden, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { addMangaToLibrariesSchema, bulkCopySchema, bulkMoveSchema, bulkRemoveSchema } from './schema'

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

  const result = await db.execute<{ libraryId: number }>(sql`
    INSERT INTO ${libraryItemTable} (library_id, manga_id)
    SELECT ${libraryTable.id}, ${mangaId}
    FROM ${libraryTable}
    LEFT JOIN ${libraryItemTable} ON ${libraryItemTable.libraryId} = ${libraryTable.id}
    WHERE ${libraryTable.userId} = ${userId} 
      AND ${libraryTable.id} = ANY(ARRAY[${sql.join(libraryIds, sql`, `)}]::int[])
      AND NOT EXISTS (
        SELECT 1 FROM ${libraryItemTable} 
        WHERE ${libraryItemTable.libraryId} = ${libraryTable.id} 
          AND ${libraryItemTable.mangaId} = ${mangaId}
      )
    GROUP BY ${libraryTable.id}
    HAVING COUNT(${libraryItemTable.mangaId}) < ${MAX_ITEMS_PER_LIBRARY}
    RETURNING ${libraryItemTable.libraryId}
  `)

  if (result.length === 0) {
    return forbidden('작품을 추가할 수 없어요')
  }

  for (const { libraryId } of result) {
    revalidatePath(`/library/${libraryId}`, 'page')
  }

  return ok(result.length)
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

  const result = await db.execute<{ mangaId: number }>(sql`
    WITH library_status AS (
      SELECT 
        ${MAX_ITEMS_PER_LIBRARY} - COUNT(${libraryItemTable.mangaId}) AS available_slots
      FROM ${libraryTable}
      LEFT JOIN ${libraryItemTable} ON ${libraryItemTable.libraryId} = ${libraryTable.id}
      WHERE ${libraryTable.userId} = ${userId} 
        AND ${libraryTable.id} = ${toLibraryId}
      GROUP BY ${libraryTable.id}
      HAVING COUNT(${libraryItemTable.mangaId}) < ${MAX_ITEMS_PER_LIBRARY}
    ),
    new_manga AS (
      SELECT manga_id
      FROM UNNEST(ARRAY[${sql.join(mangaIds, sql`, `)}]::int[]) AS manga_id
      WHERE NOT EXISTS (
        SELECT 1 FROM ${libraryItemTable} 
        WHERE ${libraryItemTable.libraryId} = ${toLibraryId} 
          AND ${libraryItemTable.mangaId} = manga_id
      )
      LIMIT (SELECT available_slots FROM library_status)
    )
    INSERT INTO ${libraryItemTable} (library_id, manga_id)
    SELECT ${toLibraryId}, manga_id
    FROM new_manga
    WHERE EXISTS (SELECT 1 FROM library_status)
    RETURNING ${libraryItemTable.mangaId}
  `)

  if (result.length === 0) {
    return forbidden('작품을 추가할 수 없어요')
  }

  revalidatePath(`/library/${data.toLibraryId}`, 'page')
  return ok(result.length)
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

  const result = await db.execute<{ mangaId: number }>(sql`
    WITH target_library_check AS (
      SELECT 
        ${MAX_ITEMS_PER_LIBRARY} - COUNT(${libraryItemTable.mangaId}) AS available_slots
      FROM ${libraryTable}
      LEFT JOIN ${libraryItemTable} ON ${libraryItemTable.libraryId} = ${libraryTable.id}
      WHERE ${libraryTable.userId} = ${userId} 
        AND ${libraryTable.id} = ${toLibraryId}
    ),
    source_library_check AS (
      SELECT COUNT(${libraryTable.id}) AS exists_count
      FROM ${libraryTable}
      WHERE ${libraryTable.userId} = ${userId}
        AND ${libraryTable.id} = ${fromLibraryId}
    ),
    movable_items AS (
      SELECT ${libraryItemTable.mangaId}
      FROM ${libraryItemTable}
      WHERE ${libraryItemTable.libraryId} = ${fromLibraryId}
        AND ${libraryItemTable.mangaId} = ANY(ARRAY[${sql.join(mangaIds, sql`, `)}]::int[])
        AND NOT EXISTS (
          SELECT 1 FROM ${libraryItemTable} AS target_items
          WHERE target_items.library_id = ${toLibraryId} 
            AND target_items.manga_id = ${libraryItemTable.mangaId}
        )
      LIMIT (SELECT available_slots FROM target_library_check)
    ),
    deleted AS (
      DELETE FROM ${libraryItemTable}
      WHERE ${libraryItemTable.libraryId} = ${fromLibraryId}
        AND ${libraryItemTable.mangaId} IN (SELECT manga_id FROM movable_items)
        AND (SELECT exists_count FROM source_library_check) = 1
      RETURNING ${libraryItemTable.mangaId}
    )
    INSERT INTO ${libraryItemTable} (library_id, manga_id)
    SELECT ${toLibraryId}, manga_id
    FROM deleted
    RETURNING ${libraryItemTable.mangaId}
  `)

  if (result.length === 0) {
    return forbidden('작품을 이동할 수 없어요')
  }

  revalidatePath(`/library/${data.fromLibraryId}`, 'page')
  revalidatePath(`/library/${data.toLibraryId}`, 'page')
  return ok(result.length)
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
    return forbidden('작품을 삭제할 수 없어요')
  }

  revalidatePath(`/library/${libraryId}`, 'page')
  return ok(result.length)
}
