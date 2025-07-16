import characterTranslationJSON from '@/database/translation/character.json'

import { Multilingual, normalizeValue } from './common'

const CHARACTER_TRANSLATION: Record<string, Multilingual> = characterTranslationJSON

/**
 * Get all characters with their translations as value/label pairs for search suggestions
 */
export function getAllCharactersWithLabels() {
  return Object.entries(CHARACTER_TRANSLATION).map(([key, translations]) => ({
    value: `character:${key}`,
    labels: {
      ko: `캐릭터:${translations.ko || translations.en || key.replace(/_/g, ' ')}`,
      en: `character:${translations.en || key.replace(/_/g, ' ')}`,
      ja: translations.ja ? `キャラクター:${translations.ja}` : undefined,
      'zh-CN': translations['zh-CN'] ? `角色:${translations['zh-CN']}` : undefined,
      'zh-TW': translations['zh-TW'] ? `角色:${translations['zh-TW']}` : undefined,
    },
  }))
}

/**
 * Translates a character name to the specified locale
 * Falls back to English if translation not found, then to original name
 */
export function translateCharacter(characterName: string, locale: keyof Multilingual): string {
  const normalizedName = normalizeValue(characterName)
  const translation = CHARACTER_TRANSLATION[normalizedName]

  if (!translation) {
    return characterName.replace(/_/g, ' ')
  }

  return translation[locale] || translation.en || characterName.replace(/_/g, ' ')
}

/**
 * Batch translate multiple character names
 */
export function translateCharacterList(characterList: string[] | undefined, locale: keyof Multilingual) {
  return characterList?.map((character) => ({
    value: character,
    label: translateCharacter(character, locale),
  }))
}
