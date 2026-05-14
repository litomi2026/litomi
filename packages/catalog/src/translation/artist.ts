import 'server-only'

import { getArtistSponsors } from '@/sponsor'

import artistTranslationJSON from './artist.json'
import { translateCategory } from './category'
import { Locale, Multilingual, normalizeValue, translateValue } from './common'

const ARTIST_TRANSLATION: Record<string, Multilingual> = artistTranslationJSON

/**
 * Get all artists with their translations as value/label pairs for search suggestions
 */
export function getAllArtistsWithLabels() {
  return Object.entries(ARTIST_TRANSLATION).map(([key, translations]) => ({
    value: `artist:${key}`,
    labels: {
      en: `${translateCategory('artist', Locale.EN)}:${translations.en}`,
      ko: `${translateCategory('artist', Locale.KO)}:${translations.ko || translations.en}`,
      ja: `${translateCategory('artist', Locale.JA)}:${translations.ja || translations.en}`,
      'zh-CN': `${translateCategory('artist', Locale.ZH_CN)}:${translations['zh-CN'] || translations.en}`,
      'zh-TW': `${translateCategory('artist', Locale.ZH_TW)}:${translations['zh-TW'] || translations.en}`,
    },
  }))
}

export function translateArtistList(artistList: string[] | undefined, locale: keyof Multilingual) {
  return artistList?.map((artist) => {
    const normalizedValue = normalizeValue(artist)
    return {
      value: normalizedValue,
      label: translateValue(ARTIST_TRANSLATION, normalizedValue, locale),
      links: getArtistSponsors(normalizedValue),
    }
  })
}
