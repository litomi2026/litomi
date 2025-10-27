import 'server-only'

import type { Multilingual } from './common'

import { normalizeValue } from './common'
import languageTranslationJSON from './language.json'

const LANGUAGE_TRANSLATION: Record<string, Multilingual> = languageTranslationJSON

export function getAllLanguagesWithLabels(locale: keyof Multilingual) {
  return Object.entries(LANGUAGE_TRANSLATION).map(([key, translations]) => ({
    value: key,
    label: translations[locale] ?? key,
  }))
}

export function translateLanguage(normalizedValue: string, locale: keyof Multilingual) {
  const translation = LANGUAGE_TRANSLATION[normalizedValue]
  return translation?.[locale] ?? normalizedValue.replaceAll('_', ' ')
}

export function translateLanguageList(values: string[] | undefined, locale: keyof Multilingual) {
  return values?.map((value) => {
    const normalizedValue = normalizeValue(value)
    return {
      value: normalizedValue,
      label: translateLanguage(normalizedValue, locale),
    }
  })
}
