import 'server-only'

import { Multilingual, normalizeValue, translateValue } from './common'
import seriesTranslationJSON from './series.json'

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
      ja: `シリーズ:${translations.ja || translations.en || key.replace(/_/g, ' ')}`,
      'zh-CN': `系列:${translations['zh-CN'] || translations.en || key.replace(/_/g, ' ')}`,
      'zh-TW': `系列:${translations['zh-TW'] || translations.en || key.replace(/_/g, ' ')}`,
    },
  }))
}

export function translateSeriesList(seriesList: string[] | undefined, locale: keyof Multilingual) {
  return seriesList?.map((series) => {
    const normalizedValue = normalizeValue(series)
    return {
      value: normalizedValue,
      label: translateValue(SERIES_TRANSLATION, normalizedValue, locale),
    }
  })
}
