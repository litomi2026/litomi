'use server'

import { captureException } from '@sentry/nextjs'
import { count, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { MAX_CRITERIA_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { notificationConditionTable, notificationCriteriaTable } from '@/database/supabase/notification'
import { badRequest, conflict, created, internalServerError, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { subscribeToKeywordSchema } from './schema'
import { areConditionsEqual, type ParsedCondition } from './utils/queryParser'

export async function subscribeToKeyword(conditions: ParsedCondition[], criteriaName: string) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = subscribeToKeywordSchema.safeParse({
    conditions,
    criteriaName,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [existingCount] = await tx
        .select({ count: count() })
        .from(notificationCriteriaTable)
        .where(eq(notificationCriteriaTable.userId, userId))

      if (existingCount.count >= MAX_CRITERIA_PER_USER) {
        return badRequest({ error: `최대 ${MAX_CRITERIA_PER_USER}개까지만 추가할 수 있어요` })
      }

      const existingCriteria = await tx
        .select({
          criteriaId: notificationCriteriaTable.id,
          criteriaName: notificationCriteriaTable.name,
          conditionType: notificationConditionTable.type,
          conditionValue: notificationConditionTable.value,
        })
        .from(notificationCriteriaTable)
        .innerJoin(notificationConditionTable, eq(notificationCriteriaTable.id, notificationConditionTable.criteriaId))
        .where(eq(notificationCriteriaTable.userId, userId))

      const criteriaMap = new Map<number, { name: string; conditions: { type: number; value: string }[] }>()

      for (const row of existingCriteria) {
        if (!criteriaMap.has(row.criteriaId)) {
          criteriaMap.set(row.criteriaId, {
            name: row.criteriaName,
            conditions: [],
          })
        }

        const criteria = criteriaMap.get(row.criteriaId)!
        criteria.conditions.push({
          type: row.conditionType,
          value: row.conditionValue,
        })
      }

      for (const [_criteriaId, criteria] of criteriaMap) {
        if (areConditionsEqual(conditions, criteria.conditions)) {
          return conflict(`이미 동일한 키워드 알림이 존재해요: ${criteria.name}`)
        }
      }

      const [criteria] = await tx
        .insert(notificationCriteriaTable)
        .values({
          userId,
          name: criteriaName,
          isActive: true,
        })
        .returning({ id: notificationCriteriaTable.id })

      const conditionValues = conditions.map((condition) => ({
        criteriaId: criteria.id,
        type: condition.type,
        value: condition.value,
      }))

      await tx.insert(notificationConditionTable).values(conditionValues)
      return criteria
    })

    if ('error' in result) {
      return result
    }

    revalidatePath('/[name]/settings', 'page')
    return created(result.id)
  } catch (error) {
    captureException(error, { extra: { name: 'quickSubscribeToSearch', userId } })
    return internalServerError('키워드 알림 설정에 실패했어요')
  }
}
