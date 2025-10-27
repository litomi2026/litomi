import 'server-only'

import { getArtistSponsors } from '@/sponsor'

import artistTranslationJSON from './artist.json'
import { Multilingual, normalizeValue, translateValue } from './common'

const ARTIST_TRANSLATION: Record<string, Multilingual> = artistTranslationJSON

/**
 * Get all artists with their translations as value/label pairs for search suggestions
 */
export function getAllArtistsWithLabels() {
  return Object.entries(ARTIST_TRANSLATION).map(([key, translations]) => ({
    value: `artist:${key}`,
    labels: {
      ko: `작가:${translations.ko || translations.en || key.replace(/_/g, ' ')}`,
      en: `artist:${translations.en || key.replace(/_/g, ' ')}`,
      ja: `アーティスト:${translations.ja || translations.en || key.replace(/_/g, ' ')}`,
      'zh-CN': `艺术家:${translations['zh-CN'] || translations.en || key.replace(/_/g, ' ')}`,
      'zh-TW': `藝術家:${translations['zh-TW'] || translations.en || key.replace(/_/g, ' ')}`,
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
