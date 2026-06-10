import 'server-only'

import type { PublicLocale } from '@litomi/domain/locale'

import { createTranslator } from 'next-intl'

import type { LocalizedTagDictionaryEntry } from './types'

import { TAG_DICTIONARY, type TagDictionaryEntry } from '../data/tag-dictionary'
import { messages as tagDictionaryMessages } from '../data/tag-dictionary.messages'

type TagDictionaryMessageKey = `entries.${TagDictionaryEntry['key']}`
type TagDictionaryTranslator = (key: TagDictionaryMessageKey) => string

export function getLocalizedTagDictionary(locale: PublicLocale): LocalizedTagDictionaryEntry[] {
  const dictionaryT = createTranslator({
    locale,
    messages: tagDictionaryMessages[locale],
    namespace: 'TagDictionary',
  }) as TagDictionaryTranslator

  return TAG_DICTIONARY.map((entry) => ({
    ...entry,
    description: dictionaryT(`entries.${entry.key}`),
  }))
}
