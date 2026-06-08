import 'server-only'
import type { Locale } from '@litomi/domain/locale'

import categoryJSON from './category.json'
import { getTranslationValue, type TranslationMap } from './common'

const CATEGORY_TRANSLATION = categoryJSON as TranslationMap

export function translateCategory(category: string, locale: Locale): string {
  const translation = CATEGORY_TRANSLATION[category]

  if (!translation) {
    return category
  }

  return getTranslationValue(translation, locale) || category
}
