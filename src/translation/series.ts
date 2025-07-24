import seriesTranslationJSON from '@/translation/series.json'

import { Multilingual, translateValue } from './common'

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

export function translateSeriesList(seriesList: string[] | undefined, locale: keyof Multilingual) {
  return seriesList?.map((series) => ({
    value: series,
    label: translateValue(SERIES_TRANSLATION, series, locale),
  }))
}
