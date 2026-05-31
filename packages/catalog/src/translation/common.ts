import { Locale } from '@litomi/domain/locale'

export type TranslationEntry<Value extends string | string[] = string> = Partial<
  Record<Exclude<Locale, Locale.EN>, Value>
> & {
  [Locale.EN]: Value
}

export type TranslationMap<Value extends string | string[] = string> = Record<string, TranslationEntry<Value>>

export function getPrefixedTranslationLabels(
  category: string,
  translations: TranslationEntry,
  translateCategory: (category: string, locale: Locale) => string,
) {
  return {
    [Locale.EN]: `${translateCategory(category, Locale.EN)}:${getTranslationValue(translations, Locale.EN)}`,
    [Locale.KO]: `${translateCategory(category, Locale.KO)}:${getTranslationValue(translations, Locale.KO)}`,
    [Locale.JA]: `${translateCategory(category, Locale.JA)}:${getTranslationValue(translations, Locale.JA)}`,
    [Locale.ZH_CN]: `${translateCategory(category, Locale.ZH_CN)}:${getTranslationValue(translations, Locale.ZH_CN)}`,
    [Locale.ZH_TW]: `${translateCategory(category, Locale.ZH_TW)}:${getTranslationValue(translations, Locale.ZH_TW)}`,
  }
}

export function getPrimaryTranslation(translations: TranslationEntry<string | string[]>, locale: Locale) {
  const value = getTranslationValue(translations, locale)
  return Array.isArray(value) ? value[0] : value
}

export function getTranslationValue<Value extends string | string[]>(
  translations: TranslationEntry<Value>,
  locale: Locale,
) {
  return translations[locale] || translations[Locale.EN]
}

export function translateValue(dict: TranslationMap, normalizedValue: string, locale: Locale) {
  const translation = dict[normalizedValue]

  if (!translation) {
    return normalizedValue.replaceAll('_', ' ')
  }

  return getTranslationValue(translation, locale) || normalizedValue.replaceAll('_', ' ')
}
