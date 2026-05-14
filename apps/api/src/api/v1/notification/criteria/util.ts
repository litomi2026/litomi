type ComparableCondition = {
  type: number
  value: string
  isExcluded?: boolean
}

export function areNotificationCriteriaConditionsEqual(
  conditions1: readonly ComparableCondition[],
  conditions2: readonly ComparableCondition[],
): boolean {
  if (conditions1.length !== conditions2.length) {
    return false
  }

  const conditionMap = new Map<string, number>()

  for (const condition of conditions1) {
    const key = getComparableConditionKey(condition)
    conditionMap.set(key, (conditionMap.get(key) ?? 0) + 1)
  }

  for (const condition of conditions2) {
    const key = getComparableConditionKey(condition)
    const count = conditionMap.get(key)

    if (!count) {
      return false
    }

    if (count === 1) {
      conditionMap.delete(key)
    } else {
      conditionMap.set(key, count - 1)
    }
  }

  return conditionMap.size === 0
}

function getComparableConditionKey(condition: ComparableCondition): string {
  return `${condition.type}:${condition.value}:${condition.isExcluded === true ? 1 : 0}`
}
