import seriesTranslationJSON from '@/database/translation/series.json'

import { Multilingual, normalizeValue } from './common'

const SERIES_TRANSLATION: Record<string, Multilingual> = seriesTranslationJSON

/**
 * Get all series with their translations as value/label pairs for search suggestions
 */
export function getAllSeriesWithLabels() {
  return Object.entries(SERIES_TRANSLATION).map(([key, translations]) => ({
    value: `series:${key}`,
    labels: {
      ko: `시리즈:${translations.ko || translations.en || key.replace(/_/g, ' ')}`,
      en: `series:${translations.en || key.replace(/_/g, ' ')}`,
      ja: translations.ja ? `シリーズ:${translations.ja}` : undefined,
      'zh-CN': translations['zh-CN'] ? `系列:${translations['zh-CN']}` : undefined,
      'zh-TW': translations['zh-TW'] ? `系列:${translations['zh-TW']}` : undefined,
    },
  }))
}

/**
 * Translates a series name to the specified locale
 * Falls back to English if translation not found, then to original name
 */
export function translateSeries(seriesName: string, locale: keyof Multilingual): string {
  const normalizedName = normalizeValue(seriesName)
  const translation = SERIES_TRANSLATION[normalizedName]

  if (!translation) {
    return seriesName.replace(/_/g, ' ')
  }

  return translation[locale] || translation.en || seriesName.replace(/_/g, ' ')
}

/**
 * Batch translate multiple series names and return as LabeledValue array
 * This is similar to how tags are handled, with value being the original name
 * and label being the translated name
 */
export function translateSeriesList(seriesList: string[] | undefined, locale: keyof Multilingual) {
  return seriesList?.map((series) => ({
    value: series,
    label: translateSeries(series, locale),
  }))
}
