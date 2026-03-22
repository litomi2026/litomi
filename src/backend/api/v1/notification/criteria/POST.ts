import { count, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_CRITERIA_NAME_LENGTH, MAX_CRITERIA_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { notificationConditionTable, notificationCriteriaTable } from '@/database/supabase/notification'
import { userTable } from '@/database/supabase/user'
import { areNotificationCriteriaConditionsEqual, notificationCriteriaConditionsSchema } from '@/notification-criteria'

type ExistingCriteriaRow = {
  criteriaId: number
  criteriaName: string
  conditionType: number
  conditionValue: string
  conditionIsExcluded: boolean
}

type TransactionResult =
  | {
      criteriaId: number
      criteriaName: string
      kind: 'conflict'
    }
  | {
      id: number
      createdAt: Date
      isActive: boolean
      kind: 'created'
      name: string
    }
  | {
      kind: 'limit'
    }

const bodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '알림 이름을 입력해 주세요')
    .max(MAX_CRITERIA_NAME_LENGTH, `알림 이름은 ${MAX_CRITERIA_NAME_LENGTH}자 이하여야 해요`),
  conditions: notificationCriteriaConditionsSchema,
  isActive: z.boolean().optional().default(true),
})

export type POSTV1NotificationCriteriaBody = z.input<typeof bodySchema>

export type POSTV1NotificationCriteriaResponse = {
  createdAt: number
  id: number
  isActive: boolean
  name: string
}

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', bodySchema), async (c) => {
  const userId = c.get('userId')!
  const { conditions, isActive, name } = c.req.valid('json')

  try {
    const result = await db.transaction(async (tx) => {
      await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

      const [{ count: existingCount }] = await tx
        .select({ count: count(notificationCriteriaTable.id) })
        .from(notificationCriteriaTable)
        .where(eq(notificationCriteriaTable.userId, userId))

      if (existingCount >= MAX_CRITERIA_PER_USER) {
        return { kind: 'limit' } satisfies TransactionResult
      }

      const existingCriteriaRows = await tx
        .select({
          criteriaId: notificationCriteriaTable.id,
          criteriaName: notificationCriteriaTable.name,
          conditionType: notificationConditionTable.type,
          conditionValue: notificationConditionTable.value,
          conditionIsExcluded: notificationConditionTable.isExcluded,
        })
        .from(notificationCriteriaTable)
        .innerJoin(notificationConditionTable, eq(notificationCriteriaTable.id, notificationConditionTable.criteriaId))
        .where(eq(notificationCriteriaTable.userId, userId))

      const duplicate = findDuplicateCriteria(conditions, existingCriteriaRows)

      if (duplicate) {
        return duplicate
      }

      const [created] = await tx
        .insert(notificationCriteriaTable)
        .values({
          userId,
          name,
          isActive,
        })
        .returning({
          id: notificationCriteriaTable.id,
          createdAt: notificationCriteriaTable.createdAt,
          isActive: notificationCriteriaTable.isActive,
          name: notificationCriteriaTable.name,
        })

      if (!created) {
        throw new Error('FAILED_TO_CREATE_NOTIFICATION_CRITERIA')
      }

      await tx.insert(notificationConditionTable).values(
        conditions.map((condition) => ({
          criteriaId: created.id,
          type: condition.type,
          value: condition.value,
          isExcluded: condition.isExcluded,
        })),
      )

      return {
        kind: 'created',
        ...created,
      } satisfies TransactionResult
    })

    if (result.kind === 'limit') {
      return problemResponse(c, {
        status: 403,
        code: 'notification-criteria-limit-reached',
        detail: `최대 ${MAX_CRITERIA_PER_USER}개까지만 추가할 수 있어요`,
      })
    }

    if (result.kind === 'conflict') {
      return problemResponse(c, {
        status: 409,
        code: 'notification-criteria-conflict',
        detail: `이미 동일한 키워드 알림이 존재해요: ${result.criteriaName}`,
        extensions: {
          existingCriteriaId: result.criteriaId,
          existingCriteriaName: result.criteriaName,
        },
      })
    }

    const response = {
      id: result.id,
      createdAt: result.createdAt.getTime(),
      isActive: result.isActive,
      name: result.name,
    }

    return c.json<POSTV1NotificationCriteriaResponse>(response, 201)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '키워드 알림 설정에 실패했어요' })
  }
})

function findDuplicateCriteria(
  conditions: POSTV1NotificationCriteriaBody['conditions'],
  rows: ExistingCriteriaRow[],
): Extract<TransactionResult, { kind: 'conflict' }> | null {
  const criteriaMap = new Map<number, { conditions: POSTV1NotificationCriteriaBody['conditions']; name: string }>()

  for (const row of rows) {
    if (!criteriaMap.has(row.criteriaId)) {
      criteriaMap.set(row.criteriaId, {
        name: row.criteriaName,
        conditions: [],
      })
    }

    criteriaMap.get(row.criteriaId)!.conditions.push({
      type: row.conditionType as POSTV1NotificationCriteriaBody['conditions'][number]['type'],
      value: row.conditionValue,
      isExcluded: row.conditionIsExcluded,
    })
  }

  for (const [criteriaId, criteria] of criteriaMap) {
    if (areNotificationCriteriaConditionsEqual(conditions, criteria.conditions)) {
      return {
        kind: 'conflict',
        criteriaId,
        criteriaName: criteria.name,
      }
    }
  }

  return null
}

export default route
