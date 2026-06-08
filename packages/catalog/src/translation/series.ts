import 'server-only'
import type { Locale } from '@litomi/domain/locale'

import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import { translateCategory } from './category'
import { getPrefixedTranslationLabels, translateValue, type TranslationMap } from './common'
import seriesTranslationJSON from './series.json'

const SERIES_TRANSLATION = seriesTranslationJSON as TranslationMap

/**
 * Get all series with their translations as value/label pairs for search suggestions
 */
export function getAllSeriesWithLabels() {
  return Object.entries(SERIES_TRANSLATION).map(([key, translations]) => ({
    value: `series:${key}`,
    labels: getPrefixedTranslationLabels('series', translations, translateCategory),
  }))
}

export function translateSeriesList(seriesList: string[] | undefined, locale: Locale) {
  return seriesList?.map((series) => {
    const normalizedValue = normalizeValue(series)
    return {
      value: normalizedValue,
      label: translateValue(SERIES_TRANSLATION, normalizedValue, locale),
    }
  })
}
