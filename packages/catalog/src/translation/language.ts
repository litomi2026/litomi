import 'server-only'
import type { Locale } from '@litomi/domain/locale'

import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import { getTranslationValue, type TranslationMap } from './common'
import languageTranslationJSON from './language.json'

const LANGUAGE_TRANSLATION = languageTranslationJSON as TranslationMap

export function getAllLanguagesWithLabels(locale: Locale) {
  return Object.entries(LANGUAGE_TRANSLATION).map(([key, translations]) => ({
    value: key,
    label: getTranslationValue(translations, locale) || key,
  }))
}

export function translateLanguage(normalizedValue: string, locale: Locale) {
  const fallback = normalizedValue.replaceAll('_', ' ')
  const translation = LANGUAGE_TRANSLATION[normalizedValue]
  return translation ? getTranslationValue(translation, locale) || fallback : fallback
}

export function translateLanguageList(values: string[] | undefined, locale: Locale) {
  return values?.map((value) => {
    const normalizedValue = normalizeValue(value)
    return {
      value: normalizedValue,
      label: translateLanguage(normalizedValue, locale),
    }
  })
}
