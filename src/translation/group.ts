import 'server-only'

import { translateCategory } from './category'
import { Locale, Multilingual, normalizeValue, translateValue } from './common'
import groupTranslationJSON from './group.json'

const GROUP_TRANSLATION: Record<string, Multilingual> = groupTranslationJSON

/**
 * Get all groups with their translations as value/label pairs for search suggestions
 */
export function getAllGroupsWithLabels() {
  return Object.entries(GROUP_TRANSLATION).map(([key, translations]) => ({
    value: `group:${key}`,
    labels: {
      en: `${translateCategory('group', Locale.EN)}:${translations.en}`,
      ko: `${translateCategory('group', Locale.KO)}:${translations.ko || translations.en}`,
      ja: `${translateCategory('group', Locale.JA)}:${translations.ja || translations.en}`,
      'zh-CN': `${translateCategory('group', Locale.ZH_CN)}:${translations['zh-CN'] || translations.en}`,
      'zh-TW': `${translateCategory('group', Locale.ZH_TW)}:${translations['zh-TW'] || translations.en}`,
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
