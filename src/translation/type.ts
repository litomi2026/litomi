import 'server-only'

import { Multilingual, normalizeValue, translateValue } from './common'
import typeTranslationJSON from './type.json'

const TYPE_TRANSLATION: Record<string, Multilingual> = typeTranslationJSON

/**
 * Get all types with their translations as value/label pairs for search suggestions
 */
export function getAllTypesWithLabels() {
  return Object.entries(TYPE_TRANSLATION).map(([key, translations]) => ({
    value: `type:${key}`,
    labels: {
      ko: `종류:${translations.ko || translations.en || key.replace(/_/g, ' ')}`,
      en: `type:${translations.en || key.replace(/_/g, ' ')}`,
      ja: translations.ja ? `タイプ:${translations.ja}` : undefined,
      'zh-CN': translations['zh-CN'] ? `类型:${translations['zh-CN']}` : undefined,
      'zh-TW': translations['zh-TW'] ? `類型:${translations['zh-TW']}` : undefined,
    },
  }))
}

export function translateType(type: string | undefined, locale: keyof Multilingual) {
  if (!type) {
    return
  }

  const normalizedType = normalizeValue(type)

  return {
    value: normalizedType,
    label: translateValue(TYPE_TRANSLATION, normalizedType, locale),
  }
}
