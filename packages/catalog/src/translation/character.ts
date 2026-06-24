import 'server-only'
import type { Locale } from '@litomi/domain/locale'

import { normalizeValue } from '@litomi/domain/utils/normalize-value'

import { getCharacterSponsors } from '../sponsor/character'
import { translateCategory } from './category'
import characterTranslationJSON from './character.json'
import { getPrefixedTranslationLabels, type TranslationMap, translateValue } from './common'

const CHARACTER_TRANSLATION = characterTranslationJSON as TranslationMap

/**
 * Get all characters with their translations as value/label pairs for search suggestions
 */
export function getAllCharactersWithLabels() {
  return Object.entries(CHARACTER_TRANSLATION).map(([characterId, translations]) => ({
    value: `character:${characterId}`,
    labels: getPrefixedTranslationLabels('character', translations, translateCategory),
  }))
}

export function translateCharacterList(characterList: string[] | undefined, locale: Locale) {
  return characterList?.map((character) => {
    const normalizedValue = normalizeValue(character)
    return {
      value: normalizedValue,
      label: translateValue(CHARACTER_TRANSLATION, normalizedValue, locale),
      links: getCharacterSponsors(normalizedValue),
    }
  })
}
