import 'server-only'
import type { Locale } from '@litomi/domain/locale'

import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import { translateCategory } from './category'
import { getPrefixedTranslationLabels, type TranslationMap, translateValue } from './common'
import typeTranslationJSON from './type.json'

const TYPE_TRANSLATION = typeTranslationJSON as TranslationMap

export function getAllTypesWithLabels() {
  return Object.entries(TYPE_TRANSLATION).map(([key, translations]) => ({
    value: `type:${key}`,
    labels: getPrefixedTranslationLabels('type', translations, translateCategory),
  }))
}

export function translateType(type: string | undefined, locale: Locale) {
  if (!type) {
    return
  }

  const normalizedType = normalizeValue(type)

  return {
    value: normalizedType,
    label: translateValue(TYPE_TRANSLATION, normalizedType, locale),
  }
}
