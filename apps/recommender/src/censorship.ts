import { CensorshipKey } from '@litomi/domain/censorship/model'
import { MANGA_TYPE_VALUE_BY_ID, TagCategory } from '@litomi/domain/manga/model'

export type CensorableManga = {
  type: number
  artists: readonly string[]
  characters: readonly string[]
  groups: readonly string[]
  languages: readonly string[]
  series: readonly string[]
  tagCategories: readonly number[]
  tagValues: readonly string[]
  uploader: string | null
}

export type CensorshipMatcher = ReadonlySet<string>

export type CensorshipRule = {
  key: CensorshipKey
  value: string
}

const CENSORSHIP_KEY_BY_TAG_CATEGORY: Record<TagCategory, CensorshipKey> = {
  [TagCategory.FEMALE]: CensorshipKey.TAG_CATEGORY_FEMALE,
  [TagCategory.MALE]: CensorshipKey.TAG_CATEGORY_MALE,
  [TagCategory.MIXED]: CensorshipKey.TAG_CATEGORY_MIXED,
  [TagCategory.OTHER]: CensorshipKey.TAG_CATEGORY_OTHER,
}

export function createCensorshipMatcher(rules: readonly CensorshipRule[]): CensorshipMatcher {
  return new Set(rules.map((rule) => getCensorshipLookupKey(rule.key, rule.value)))
}

export function isMangaHiddenByCensorship(manga: CensorableManga, matcher: CensorshipMatcher) {
  if (matcher.size === 0) {
    return false
  }

  for (let index = 0; index < manga.tagValues.length; index++) {
    const tagValue = manga.tagValues[index]

    if (hasCensorshipMatch(matcher, CensorshipKey.TAG, tagValue)) {
      return true
    }

    const category = manga.tagCategories[index] ?? TagCategory.OTHER
    const categoryKey = CENSORSHIP_KEY_BY_TAG_CATEGORY[category as TagCategory]

    if (categoryKey && hasCensorshipMatch(matcher, categoryKey, tagValue)) {
      return true
    }
  }

  if (manga.artists.some((value) => hasCensorshipMatch(matcher, CensorshipKey.ARTIST, value))) {
    return true
  }

  if (manga.characters.some((value) => hasCensorshipMatch(matcher, CensorshipKey.CHARACTER, value))) {
    return true
  }

  if (manga.groups.some((value) => hasCensorshipMatch(matcher, CensorshipKey.GROUP, value))) {
    return true
  }

  if (manga.series.some((value) => hasCensorshipMatch(matcher, CensorshipKey.SERIES, value))) {
    return true
  }

  if (manga.languages.some((value) => hasCensorshipMatch(matcher, CensorshipKey.LANGUAGE, value))) {
    return true
  }

  if (manga.uploader && hasCensorshipMatch(matcher, CensorshipKey.UPLOADER, manga.uploader)) {
    return true
  }

  const typeValue = MANGA_TYPE_VALUE_BY_ID[manga.type]

  return Boolean(typeValue && hasCensorshipMatch(matcher, CensorshipKey.TYPE, typeValue))
}

function getCensorshipLookupKey(key: CensorshipKey, value: string) {
  return `${key}:${value.trim().toLowerCase()}`
}

function hasCensorshipMatch(matcher: CensorshipMatcher, key: CensorshipKey, value: string) {
  return matcher.has(getCensorshipLookupKey(key, value))
}
