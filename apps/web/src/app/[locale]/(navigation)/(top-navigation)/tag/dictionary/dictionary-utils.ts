import type { TagDictionaryTypeKey } from '../data/tag-dictionary'

export type DictionaryCategoryStat = {
  category: TagDictionaryTypeKey
  count: number
}

type DictionaryEntryWithTypes = {
  tagTypes: readonly [TagDictionaryTypeKey, ...TagDictionaryTypeKey[]]
}

export function getDictionaryCategoryStats(entries: readonly DictionaryEntryWithTypes[]) {
  const counts = new Map<TagDictionaryTypeKey, number>()

  for (const entry of entries) {
    const category = getDictionaryPrimaryType(entry)
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }

  return Array.from(counts, ([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count)
}

export function getDictionaryPrimaryType(entry: DictionaryEntryWithTypes) {
  return entry.tagTypes[0]
}
