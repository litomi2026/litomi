import {
  idParamSchema,
  type PATCHV1NotificationCriteriaIdResponse,
  patchV1NotificationCriteriaIdBodySchema,
} from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { notificationConditionTable, notificationCriteriaTable } from '@litomi/db/app/notification'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.patch(
  '/',
  zProblemValidator('param', idParamSchema),
  zProblemValidator('json', patchV1NotificationCriteriaIdBodySchema),
  async (c) => {
    const userId = c.get('userId')!
    const { id: criteriaId } = c.req.valid('param')
    const { name, conditions, isActive } = c.req.valid('json')

    try {
      const result = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(notificationCriteriaTable)
          .set({
            updatedAt: new Date(),
            ...(name !== undefined && { name }),
            ...(isActive !== undefined && { isActive }),
          })
          .where(and(eq(notificationCriteriaTable.id, criteriaId), eq(notificationCriteriaTable.userId, userId)))
          .returning({
            id: notificationCriteriaTable.id,
            name: notificationCriteriaTable.name,
            isActive: notificationCriteriaTable.isActive,
          })

        if (!updated) {
          return null
        }

        if (conditions) {
          await tx.delete(notificationConditionTable).where(eq(notificationConditionTable.criteriaId, criteriaId))

          await tx.insert(notificationConditionTable).values(
            conditions.map((condition) => ({
              criteriaId,
              type: condition.type,
              value: condition.value,
              isExcluded: condition.isExcluded,
            })),
          )
        }

        return updated
      })

      if (!result) {
        return problemResponse(c, { status: 404, detail: '알림 기준을 찾을 수 없어요' })
      }

      return c.json(result satisfies PATCHV1NotificationCriteriaIdResponse)
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500, detail: '알림 기준 수정 중 오류가 발생했어요' })
    }
  },
)

export default route
