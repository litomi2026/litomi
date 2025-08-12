import { NotificationConditionType } from '@/database/enum'
import { normalizeValue } from '@/translation/common'

export type ParsedCondition = {
  type: NotificationConditionType
  value: string
  displayValue: string
}

export type ParsedSearchQuery = {
  conditions: ParsedCondition[]
  plainKeywords: string[]
  suggestedName: string
}

const CATEGORY_TO_TYPE_MAP: Record<string, NotificationConditionType> = {
  series: NotificationConditionType.SERIES,
  parody: NotificationConditionType.SERIES,
  character: NotificationConditionType.CHARACTER,
  tag: NotificationConditionType.TAG,
  female: NotificationConditionType.TAG,
  male: NotificationConditionType.TAG,
  mixed: NotificationConditionType.TAG,
  other: NotificationConditionType.TAG,
  artist: NotificationConditionType.ARTIST,
  group: NotificationConditionType.GROUP,
  language: NotificationConditionType.LANGUAGE,
  // Korean mappings
  시리즈: NotificationConditionType.SERIES,
  패러디: NotificationConditionType.SERIES,
  캐릭터: NotificationConditionType.CHARACTER,
  태그: NotificationConditionType.TAG,
  여성: NotificationConditionType.TAG,
  남성: NotificationConditionType.TAG,
  혼합: NotificationConditionType.TAG,
  기타: NotificationConditionType.TAG,
  작가: NotificationConditionType.ARTIST,
  그룹: NotificationConditionType.GROUP,
  언어: NotificationConditionType.LANGUAGE,
}

export function areConditionsEqual(
  conditions1: ParsedCondition[],
  conditions2: { type: NotificationConditionType; value: string }[],
): boolean {
  if (conditions1.length !== conditions2.length) {
    return false
  }

  const conditionMap = new Map<string, number>()

  for (const condition of conditions1) {
    const key = `${condition.type}-${condition.value}`
    conditionMap.set(key, (conditionMap.get(key) || 0) + 1)
  }

  for (const condition of conditions2) {
    const key = `${condition.type}-${condition.value}`
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

// TODO: 로직 검증 필요
/**
 * Parses a search query into notification conditions
 * Extracts structured queries like "female:tag artist:name" into conditions
 * and plain keywords for potential tag matching
 *
 * Optimized single-pass algorithm with O(n) time complexity
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  if (!query?.trim()) {
    return { conditions: [], plainKeywords: [], suggestedName: '' }
  }

  const conditions: ParsedCondition[] = []
  const plainKeywords: string[] = []
  const processedParts: string[] = []

  let i = 0
  const len = query.length

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(query[i])) {
      i++
    }

    if (i >= len) break

    // Check for minus prefix
    const isExclusion = query[i] === '-'
    if (isExclusion) {
      i++
    }

    // Collect the word/category
    const wordStart = i
    while (i < len && isWordChar(query[i])) {
      i++
    }

    if (i > wordStart) {
      const currentWord = query.slice(wordStart, i)

      // Check if this is a category:value pair
      if (i < len && query[i] === ':') {
        i++ // Skip the colon

        // Collect the value (non-whitespace characters)
        const valueStart = i
        while (i < len && !/\s/.test(query[i])) {
          i++
        }

        if (i > valueStart && !isExclusion) {
          const category = currentWord.toLowerCase()
          const conditionType = CATEGORY_TO_TYPE_MAP[category]

          if (conditionType) {
            const value = query.slice(valueStart, i)
            const normalizedValue = normalizeValue(value)

            conditions.push({
              type: conditionType,
              value: normalizedValue,
              displayValue: value,
            })

            processedParts.push(value)
          } else {
            // Not a recognized category, treat as plain keyword
            const fullKeyword = currentWord + ':' + query.slice(valueStart, i)
            if (!isExclusion) {
              plainKeywords.push(fullKeyword)
              processedParts.push(fullKeyword)
            }
          }
        }
      } else {
        // It's a plain keyword
        if (!isExclusion) {
          plainKeywords.push(currentWord)
          processedParts.push(currentWord)
        }
      }
    } else {
      // Handle non-word characters as part of keywords
      const keywordStart = i
      while (i < len && !/\s/.test(query[i]) && query[i] !== '-' && !isWordChar(query[i])) {
        i++
      }

      if (i > keywordStart && !isExclusion) {
        const keyword = query.slice(keywordStart, i)
        plainKeywords.push(keyword)
        processedParts.push(keyword)
      }
    }
  }

  const suggestedName = generateSuggestedName(processedParts, conditions)

  return { conditions, plainKeywords, suggestedName }
}

// Helper function to check if a character is part of a word (including Unicode)
const isWordChar = (char: string): boolean => {
  return /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(char)
}

/**
 * Generates a user-friendly name for the notification criteria
 * Prioritizes specific tags/artists over generic keywords
 */
function generateSuggestedName(parts: string[], conditions: ParsedCondition[]): string {
  // If we have specific conditions, prioritize those
  if (conditions.length > 0) {
    const priorityConditions = conditions
      .filter(
        (c) =>
          c.type === NotificationConditionType.ARTIST ||
          c.type === NotificationConditionType.SERIES ||
          c.type === NotificationConditionType.CHARACTER,
      )
      .slice(0, 2)

    if (priorityConditions.length > 0) {
      return priorityConditions.map((c) => c.displayValue).join(', ')
    }

    // Fall back to first few conditions
    return conditions
      .slice(0, 2)
      .map((c) => c.displayValue)
      .join(', ')
  }

  // Use plain keywords if no conditions
  if (parts.length > 0) {
    return parts.slice(0, 2).join(' ')
  }

  return '검색 알림'
}
