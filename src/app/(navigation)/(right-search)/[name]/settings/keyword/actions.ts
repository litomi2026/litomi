'use server'

import { captureException } from '@sentry/nextjs'
import { and, count, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { MAX_CRITERIA_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { notificationConditionTable, notificationCriteriaTable } from '@/database/supabase/notification'
import {
  badRequest,
  created,
  internalServerError,
  noContent,
  notFound,
  ok,
  unauthorized,
} from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { createCriteriaSchema, deleteCriteriaSchema, updateCriteriaSchema } from './schema'

export async function createNotificationCriteria(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = createCriteriaSchema.safeParse({
    name: formData.get('name'),
    conditions: JSON.parse((formData.get('conditions') as string) || '[]'),
    isActive: formData.get('isActive') === 'true',
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { name, conditions, isActive } = validation.data

  try {
    const result = await db.transaction(async (tx) => {
      const [existingCount] = await tx
        .select({ count: count() })
        .from(notificationCriteriaTable)
        .where(sql`${notificationCriteriaTable.userId} = ${userId}`)

      if (existingCount.count >= MAX_CRITERIA_PER_USER) {
        return badRequest({ name: `최대 ${MAX_CRITERIA_PER_USER}개까지만 추가할 수 있어요` }, formData)
      }

      const [criteria] = await tx
        .insert(notificationCriteriaTable)
        .values({
          userId,
          name,
          isActive,
        })
        .returning({ id: notificationCriteriaTable.id })

      const conditionValues = conditions.map((condition) => ({
        criteriaId: criteria.id,
        type: condition.type,
        value: condition.value,
        isExcluded: condition.isExcluded,
      }))

      await tx.insert(notificationConditionTable).values(conditionValues)
      return criteria
    })

    if ('error' in result) {
      return result
    }

    revalidatePath('/[name]/settings', 'page')
    return created('알림 기준을 생성했어요')
  } catch (error) {
    captureException(error, { extra: { name: 'createNotificationCriteria', userId } })
    return internalServerError('알림 기준 생성 중 오류가 발생했어요', formData)
  }
}

export async function deleteNotificationCriteria(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = deleteCriteriaSchema.safeParse({
    id: formData.get('id'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { id: criteriaId } = validation.data

  try {
    const result = await db
      .delete(notificationCriteriaTable)
      .where(and(eq(notificationCriteriaTable.id, criteriaId), sql`${notificationCriteriaTable.userId} = ${userId}`))
      .returning({ id: notificationCriteriaTable.id })

    if (result.length === 0) {
      return notFound('알림 기준을 찾을 수 없어요')
    }

    revalidatePath('/[name]/settings', 'page')
    return noContent()
  } catch (error) {
    captureException(error, { extra: { name: 'deleteNotificationCriteria', userId, criteriaId } })
    return internalServerError('알림 기준 삭제 중 오류가 발생했어요')
  }
}

export async function toggleNotificationCriteria(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인이 필요해요')
  }

  const criteriaId = formData.get('id')
  const isActive = formData.get('isActive') === 'true'

  if (!criteriaId) {
    return badRequest({ id: '기준 ID가 필요해요' })
  }

  try {
    const [updatedCriteria] = await db
      .update(notificationCriteriaTable)
      .set({
        isActive: !isActive,
        updatedAt: new Date(),
      })
      .where(
        and(sql`${notificationCriteriaTable.id} = ${criteriaId}`, sql`${notificationCriteriaTable.userId} = ${userId}`),
      )
      .returning({ id: notificationCriteriaTable.id, isActive: notificationCriteriaTable.isActive })

    revalidatePath('/[name]/settings', 'page')
    return ok(updatedCriteria)
  } catch (error) {
    captureException(error, { extra: { name: 'toggleNotificationCriteria', userId, criteriaId } })
    return internalServerError('알림 기준 상태 변경 중 오류가 발생했어요')
  }
}

export async function updateNotificationCriteria(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = updateCriteriaSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name') || undefined,
    conditions: formData.get('conditions') ? JSON.parse(formData.get('conditions') as string) : undefined,
    isActive: formData.get('isActive') !== null ? formData.get('isActive') === 'true' : undefined,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { id: criteriaId, name, conditions, isActive } = validation.data

  try {
    // Verify ownership
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(notificationCriteriaTable)
        .where(and(eq(notificationCriteriaTable.id, criteriaId), sql`${notificationCriteriaTable.userId} = ${userId}`))

      if (!existing) {
        return notFound('알림 기준을 찾을 수 없어요', formData)
      }

      const updates: { updatedAt: Date; name?: string; isActive?: boolean } = { updatedAt: new Date() }
      if (name !== undefined) updates.name = name
      if (isActive !== undefined) updates.isActive = isActive

      await tx.update(notificationCriteriaTable).set(updates).where(eq(notificationCriteriaTable.id, criteriaId))

      // Update conditions if provided
      if (conditions) {
        // Delete existing conditions
        await tx.delete(notificationConditionTable).where(eq(notificationConditionTable.criteriaId, criteriaId))

        // Insert new conditions
        const conditionValues = conditions.map((condition) => ({
          criteriaId: criteriaId,
          type: condition.type,
          value: condition.value, // Already normalized in schema
          isExcluded: condition.isExcluded,
        }))

        await tx.insert(notificationConditionTable).values(conditionValues)
      }

      return existing
    })

    if ('error' in result) {
      return result
    }

    revalidatePath('/[name]/settings', 'page')
    return ok('알림 기준을 수정했어요')
  } catch (error) {
    captureException(error, { extra: { name: 'updateNotificationCriteria', userId, criteriaId } })
    return internalServerError('알림 기준 수정 중 오류가 발생했어요', formData)
  }
}
