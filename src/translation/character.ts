import 'server-only'

import { getCharacterSponsors } from '@/sponsor'

import { translateCategory } from './category'
import characterTranslationJSON from './character.json'
import { Locale, Multilingual, normalizeValue, translateValue } from './common'

const CHARACTER_TRANSLATION: Record<string, Multilingual> = characterTranslationJSON

/**
 * Get all characters with their translations as value/label pairs for search suggestions
 */
export function getAllCharactersWithLabels() {
  return Object.entries(CHARACTER_TRANSLATION).map(([characterId, translations]) => ({
    value: `character:${characterId}`,
    labels: {
      en: `${translateCategory('character', Locale.EN)}:${translations.en}`,
      ko: `${translateCategory('character', Locale.KO)}:${translations.ko || translations.en}`,
      ja: `${translateCategory('character', Locale.JA)}:${translations.ja || translations.en}`,
      'zh-CN': `${translateCategory('character', Locale.ZH_CN)}:${translations['zh-CN'] || translations.en}`,
      'zh-TW': `${translateCategory('character', Locale.ZH_TW)}:${translations['zh-TW'] || translations.en}`,
    },
  }))
}

export function translateCharacterList(characterList: string[] | undefined, locale: keyof Multilingual) {
  return characterList?.map((character) => {
    const normalizedValue = normalizeValue(character)
    return {
      value: normalizedValue,
      label: translateValue(CHARACTER_TRANSLATION, normalizedValue, locale),
      links: getCharacterSponsors(normalizedValue),
    }
  })
}
