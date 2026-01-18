'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/database/supabase/drizzle'
import { libraryTable } from '@/database/supabase/library'
import { badRequest, internalServerError, notFound, ok, unauthorized } from '@/utils/action-response'
import { hexColorToInt } from '@/utils/color'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { updateLibrarySchema } from './schema'

export async function deleteLibrary(libraryId: number) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    const [deletedLibrary] = await db
      .delete(libraryTable)
      .where(and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId)))
      .returning({ id: libraryTable.id })

    if (!deletedLibrary) {
      return notFound('서재를 찾을 수 없어요')
    }

    revalidatePath('/library', 'layout')
    return ok(deletedLibrary.id)
  } catch (error) {
    captureException(error)
    return internalServerError('서재를 삭제하지 못했어요')
  }
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

  try {
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
  } catch (error) {
    captureException(error)
    return internalServerError('서재를 수정하지 못했어요')
  }
}
