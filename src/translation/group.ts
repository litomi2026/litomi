import 'server-only'

import { Multilingual, normalizeValue, translateValue } from './common'
import groupTranslationJSON from './group.json'

const GROUP_TRANSLATION: Record<string, Multilingual> = groupTranslationJSON

/**
 * Get all groups with their translations as value/label pairs for search suggestions
 */
export function getAllGroupsWithLabels() {
  return Object.entries(GROUP_TRANSLATION).map(([key, translations]) => ({
    value: `group:${key}`,
    labels: {
      ko: `그룹:${translations.ko || translations.en || key.replace(/_/g, ' ')}`,
      en: `group:${translations.en || key.replace(/_/g, ' ')}`,
      ja: translations.ja ? `グループ:${translations.ja}` : undefined,
      'zh-CN': translations['zh-CN'] ? `团体:${translations['zh-CN']}` : undefined,
      'zh-TW': translations['zh-TW'] ? `團體:${translations['zh-TW']}` : undefined,
    },
  }))
}

export function translateGroupList(groupList: string[] | undefined, locale: keyof Multilingual) {
  return groupList?.map((group) => {
    const normalizedValue = normalizeValue(group)
    return {
      value: normalizedValue,
      label: translateValue(GROUP_TRANSLATION, normalizedValue, locale),
    }
  })
}
