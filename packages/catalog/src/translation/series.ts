import 'server-only'

import { translateCategory } from './category'
import { Locale, Multilingual, normalizeValue, translateValue } from './common'
import seriesTranslationJSON from './series.json'

const SERIES_TRANSLATION: Record<string, Multilingual> = seriesTranslationJSON

/**
 * Get all series with their translations as value/label pairs for search suggestions
 */
export function getAllSeriesWithLabels() {
  return Object.entries(SERIES_TRANSLATION).map(([key, translations]) => ({
    value: `series:${key}`,
    labels: {
      en: `${translateCategory('series', Locale.EN)}:${translations.en}`,
      ko: `${translateCategory('series', Locale.KO)}:${translations.ko || translations.en}`,
      ja: `${translateCategory('series', Locale.JA)}:${translations.ja || translations.en}`,
      'zh-CN': `${translateCategory('series', Locale.ZH_CN)}:${translations['zh-CN'] || translations.en}`,
      'zh-TW': `${translateCategory('series', Locale.ZH_TW)}:${translations['zh-TW'] || translations.en}`,
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
