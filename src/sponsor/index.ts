import 'server-only'

import { chance } from '@/utils/random-edge'

import artistSponsorsJSON from './artist.json'
import characterSponsorsJSON from './character.json'
import keywordsJSON from './keyword.json'

export type KeywordPromotion = {
  id: string
  url: string
  title: string
  description: string
  badge?: string
  position?: number
  probability?: number
}

type KeywordData = {
  promotions: Record<string, KeywordPromotion>
  keywords: Record<string, string>
}

type Sponsor = {
  label: string
  value: string
}

const ARTIST_SPONSORS: Record<string, Sponsor[]> = artistSponsorsJSON
const CHARACTER_SPONSORS: Record<string, Sponsor[]> = characterSponsorsJSON
const KEYWORD_DATA: KeywordData = keywordsJSON

export function getArtistSponsors(artistValue: string): Sponsor[] | undefined {
  return ARTIST_SPONSORS[artistValue]
}

export function getCharacterSponsors(characterValue: string): Sponsor[] | undefined {
  return CHARACTER_SPONSORS[characterValue]
}

export function getKeywordPromotion(query: string | undefined): KeywordPromotion | null {
  if (!query) {
    return null
  }

  const lowerQuery = query.toLowerCase()

  for (const [keyword, promotionId] of Object.entries(KEYWORD_DATA.keywords)) {
    if (lowerQuery.includes(keyword)) {
      const promotion = KEYWORD_DATA.promotions[promotionId]

      if (promotion && (!promotion.probability || chance(promotion.probability))) {
        return promotion
      }
    }
  }

  return null
}
