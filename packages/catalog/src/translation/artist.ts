import 'server-only'
import type { Locale } from '@litomi/domain/locale'

import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import { getArtistSponsors } from '../sponsor/artist'
import artistTranslationJSON from './artist.json'
import { translateCategory } from './category'
import { getPrefixedTranslationLabels, translateValue, type TranslationMap } from './common'

const ARTIST_TRANSLATION: TranslationMap = artistTranslationJSON

/**
 * Get all artists with their translations as value/label pairs for search suggestions
 */
export function getAllArtistsWithLabels() {
  return Object.entries(ARTIST_TRANSLATION).map(([key, translations]) => ({
    value: `artist:${key}`,
    labels: getPrefixedTranslationLabels('artist', translations, translateCategory),
  }))
}

export function translateArtistList(artistList: string[] | undefined, locale: Locale) {
  return artistList?.map((artist) => {
    const normalizedValue = normalizeValue(artist)
    return {
      value: normalizedValue,
      label: translateValue(ARTIST_TRANSLATION, normalizedValue, locale),
      links: getArtistSponsors(normalizedValue),
    }
  })
}
