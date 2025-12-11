'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq, sum } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { EXPANSION_TYPE, POINT_CONSTANTS } from '@/constants/points'
import { MAX_LIBRARIES_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { userExpansionTable } from '@/database/supabase/points-schema'
import { libraryTable } from '@/database/supabase/schema'
import { badRequest, created, internalServerError, notFound, ok, unauthorized } from '@/utils/action-response'
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

  try {
    const newLibraryId = await db.transaction(async (tx) => {
      // 1. 현재 라이브러리 조회 (FOR UPDATE 락으로 동시성 보장)
      const userLibraries = await tx
        .select({ id: libraryTable.id })
        .from(libraryTable)
        .where(eq(libraryTable.userId, userId))
        .for('update')

      // 2. 확장량 조회
      const [expansion] = await tx
        .select({ totalAmount: sum(userExpansionTable.amount) })
        .from(userExpansionTable)
        .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, EXPANSION_TYPE.LIBRARY)))

      // 3. 제한 계산
      const extra = Number(expansion?.totalAmount ?? 0)
      const userLibraryLimit = Math.min(MAX_LIBRARIES_PER_USER + extra, POINT_CONSTANTS.LIBRARY_MAX_EXPANSION)

      // 4. 제한 체크
      if (userLibraries.length >= userLibraryLimit) {
        throw new Error('LIMIT_REACHED')
      }

      // 5. INSERT
      const [newLibrary] = await tx
        .insert(libraryTable)
        .values({
          userId,
          name,
          description: description || null,
          color: color ? hexColorToInt(color) : null,
          icon: icon || null,
          isPublic,
        })
        .returning({ id: libraryTable.id })

      return newLibrary.id
    })

    revalidatePath('/library', 'layout')
    return created(newLibraryId)
  } catch (error) {
    captureException(error)
    return internalServerError('서재를 생성하지 못했어요')
  }
}

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
