import type { Locale } from '@litomi/domain/locale'

import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import { translateCategory } from './category'
import { getPrefixedTranslationLabels, type TranslationMap, translateValue } from './common'
import groupTranslationJSON from './group.json'

const GROUP_TRANSLATION = groupTranslationJSON as TranslationMap

/**
 * Get all groups with their translations as value/label pairs for search suggestions
 */
export function getAllGroupsWithLabels() {
  return Object.entries(GROUP_TRANSLATION).map(([key, translations]) => ({
    value: `group:${key}`,
    labels: getPrefixedTranslationLabels('group', translations, translateCategory),
  }))
}

export function translateGroupList(groupList: string[] | undefined, locale: Locale) {
  return groupList?.map((group) => {
    const normalizedValue = normalizeValue(group)
    return {
      value: normalizedValue,
      label: translateValue(GROUP_TRANSLATION, normalizedValue, locale),
    }
  })
}
