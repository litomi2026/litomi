import 'server-only'

import { translateCategory } from './category'
import { Locale, Multilingual, normalizeValue, translateValue } from './common'
import typeTranslationJSON from './type.json'

const TYPE_TRANSLATION: Record<string, Multilingual> = typeTranslationJSON

export function getAllTypesWithLabels() {
  return Object.entries(TYPE_TRANSLATION).map(([key, translations]) => ({
    value: `type:${key}`,
    labels: {
      en: `${translateCategory('type', Locale.EN)}:${translations.en}`,
      ko: `${translateCategory('type', Locale.KO)}:${translations.ko || translations.en}`,
      ja: `${translateCategory('type', Locale.JA)}:${translations.ja || translations.en}`,
      'zh-CN': `${translateCategory('type', Locale.ZH_CN)}:${translations['zh-CN'] || translations.en}`,
      'zh-TW': `${translateCategory('type', Locale.ZH_TW)}:${translations['zh-TW'] || translations.en}`,
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
