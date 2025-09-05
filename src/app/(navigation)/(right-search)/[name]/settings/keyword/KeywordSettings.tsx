import { eq } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { notificationConditionTable, notificationCriteriaTable } from '@/database/notification-schema'

import KeywordSettingsForm from './KeywordSettingsForm'

type CriteriaWithConditions = {
  id: number
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  conditions: Array<{ type: number; value: string }>
  matchCount: number
  lastMatchedAt: Date | null
}

export default async function KeywordSettings({ userId }: { userId: number }) {
  const criteria = await getUserCriteria(userId)

  return <KeywordSettingsForm initialCriteria={criteria} />
}

async function getUserCriteria(userId: number) {
  const results = await db
    .select({
      criteriaId: notificationCriteriaTable.id,
      criteriaName: notificationCriteriaTable.name,
      criteriaIsActive: notificationCriteriaTable.isActive,
      criteriaCreatedAt: notificationCriteriaTable.createdAt,
      criteriaUpdatedAt: notificationCriteriaTable.updatedAt,
      criteriaMatchCount: notificationCriteriaTable.matchCount,
      criteriaLastMatchedAt: notificationCriteriaTable.lastMatchedAt,
      conditionType: notificationConditionTable.type,
      conditionValue: notificationConditionTable.value,
    })
    .from(notificationCriteriaTable)
    .innerJoin(notificationConditionTable, eq(notificationCriteriaTable.id, notificationConditionTable.criteriaId))
    .where(eq(notificationCriteriaTable.userId, userId))
    .orderBy(notificationCriteriaTable.createdAt)

  const criteriaMap = new Map<number, CriteriaWithConditions>()

  for (const row of results) {
    const criteriaId = row.criteriaId

    if (!criteriaMap.has(criteriaId)) {
      criteriaMap.set(criteriaId, {
        id: criteriaId,
        name: row.criteriaName,
        isActive: row.criteriaIsActive,
        createdAt: row.criteriaCreatedAt,
        updatedAt: row.criteriaUpdatedAt,
        conditions: [],
        matchCount: row.criteriaMatchCount,
        lastMatchedAt: row.criteriaLastMatchedAt,
      })
    }

    // With INNER JOIN, conditions are guaranteed to exist
    const criteria = criteriaMap.get(criteriaId)
    if (criteria) {
      criteria.conditions.push({
        type: row.conditionType,
        value: row.conditionValue,
      })
    }
  }

  return Array.from(criteriaMap.values())
}
