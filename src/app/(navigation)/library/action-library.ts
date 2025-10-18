'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { MAX_LIBRARIES_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryTable } from '@/database/supabase/schema'
import { badRequest, created, notFound, ok, unauthorized } from '@/utils/action-response'
import { hexColorToInt } from '@/utils/color'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { createLibrarySchema, updateLibrarySchema } from './schema'

export async function createLibrary(formData: FormData) {
  const userId = await validateUserIdFromCookie()

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

  const [newLibrary] = await db.execute<{ id: number }>(sql`
    INSERT INTO ${libraryTable} (user_id, name, description, color, icon, is_public)
    SELECT 
      ${userId},
      ${name},
      ${description},
      ${color ? hexColorToInt(color) : null},
      ${icon},
      ${isPublic}
    WHERE (
      SELECT COUNT(${libraryTable.id}) 
      FROM ${libraryTable} 
      WHERE ${libraryTable.userId} = ${userId}
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
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const [deletedLibrary] = await db
    .delete(libraryTable)
    .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId)))
    .returning({ id: libraryTable.id })

  if (!deletedLibrary) {
    return notFound('서재를 찾을 수 없어요')
  }

  revalidatePath('/library', 'layout')
  return ok(deletedLibrary.id)
}

export async function updateLibrary(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = updateLibrarySchema.safeParse({
    libraryId: formData.get('library-id'),
    name: formData.get('name'),
    description: formData.get('description'),
    color: formData.get('color'),
    icon: formData.get('icon'),
    isPublic: formData.get('is-public') === 'on',
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { libraryId, name, description, color, icon, isPublic } = validation.data

  const [updatedLibrary] = await db
    .update(libraryTable)
    .set({
      name: name.trim(),
      description: description?.trim() || null,
      color: color ? hexColorToInt(color) : null,
      icon: icon || null,
      isPublic,
    })
    .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId)))
    .returning({ id: libraryTable.id })

  if (!updatedLibrary) {
    return notFound('서재를 찾을 수 없어요', formData)
  }

  revalidatePath('/library', 'layout')
  revalidatePath(`/library/${libraryId}`, 'page')
  return ok(updatedLibrary.id)
}
