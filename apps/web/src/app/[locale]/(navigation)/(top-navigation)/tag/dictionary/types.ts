import type { TagDictionaryEntry } from '../data/tag-dictionary'

export type LocalizedTagDictionaryEntry = TagDictionaryEntry & {
  description: string
}
