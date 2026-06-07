import type { CensorshipItem } from '@litomi/contracts'
import type { Manga } from '@litomi/domain/manga/model'

import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'

import { DEFAULT_CENSORSHIP_VALUES } from '@/app/[locale]/(navigation)/(right-aside)/censor/constants'

export type MangaCensorshipMatch = {
  censoringReasons?: string[]
  highestCensorshipLevel?: CensorshipLevel
}

type Params = {
  manga: Manga
  censorshipsMap: Map<string, CensorshipItem> | undefined
  defaultCensorshipEnabled?: boolean
}

export function getHeavyCensorshipSignature(censorshipsMap: Map<string, CensorshipItem> | undefined) {
  if (!censorshipsMap) {
    return 'heavy:none'
  }

  const heavyKeys: string[] = []

  for (const [key, censorship] of censorshipsMap) {
    if (censorship.level === CensorshipLevel.HEAVY) {
      heavyKeys.push(key)
    }
  }

  if (heavyKeys.length === 0) {
    return 'heavy:none'
  }

  return `heavy:${heavyKeys.sort().join(',')}`
}

export function getMatchedCensorships({ manga, censorshipsMap, defaultCensorshipEnabled }: Params) {
  const { artists, characters, group, series, tags, languages, uploader, type } = manga
  let highest = CensorshipLevel.LIGHT
  const matchedLabels: string[] = []

  function applyMatch(key: CensorshipKey, value: string, label: string) {
    const lookupKey = `${key}:${value}`
    const userMatch = censorshipsMap?.get(lookupKey)
    const defaultMatch = DEFAULT_CENSORSHIP_VALUES.find((item) => item.key === key && item.value === value)

    if (defaultMatch) {
      if (userMatch?.level === CensorshipLevel.NONE) {
        return
      }

      if (userMatch) {
        matchedLabels.push(label)
        highest = Math.max(highest, userMatch.level)
      } else if (defaultCensorshipEnabled) {
        matchedLabels.push(label)
        highest = Math.max(highest, CensorshipLevel.LIGHT)
      }
      return
    }

    if (userMatch && userMatch.level !== CensorshipLevel.NONE) {
      matchedLabels.push(label)
      highest = Math.max(highest, userMatch.level)
    }
  }

  for (const tag of tags ?? []) {
    applyMatch(CensorshipKey.TAG, tag.value, getTagDisplayLabel(tag.label))
  }

  // 개별 태그: male, female, mixed, other
  for (const tag of tags ?? []) {
    const tagKey = mapTagCategoryToCensorshipKey(tag.category)

    if (tagKey) {
      applyMatch(tagKey, tag.value, getTagDisplayLabel(tag.label))
    }
  }

  for (const artist of artists ?? []) {
    applyMatch(CensorshipKey.ARTIST, artist.value, artist.label)
  }

  for (const character of characters ?? []) {
    applyMatch(CensorshipKey.CHARACTER, character.value, character.label)
  }

  for (const g of group ?? []) {
    applyMatch(CensorshipKey.GROUP, g.value, g.label)
  }

  for (const s of series ?? []) {
    applyMatch(CensorshipKey.SERIES, s.value, s.label)
  }

  for (const language of languages ?? []) {
    applyMatch(CensorshipKey.LANGUAGE, language.value, language.label)
  }

  if (uploader) {
    applyMatch(CensorshipKey.UPLOADER, uploader, uploader)
  }

  if (type) {
    applyMatch(CensorshipKey.TYPE, type.value, type.label)
  }

  return createCensorshipMatch(matchedLabels, highest)
}

function createCensorshipMatch(matchedLabels: string[], highest: CensorshipLevel): MangaCensorshipMatch {
  if (matchedLabels.length === 0) {
    return {}
  }

  return {
    censoringReasons: Array.from(new Set(matchedLabels)),
    highestCensorshipLevel: highest,
  }
}

function getTagDisplayLabel(label: string) {
  return label.split(':')[1] ?? label
}

function mapTagCategoryToCensorshipKey(category: string): CensorshipKey | null {
  switch (category) {
    case 'female':
      return CensorshipKey.TAG_CATEGORY_FEMALE
    case 'male':
      return CensorshipKey.TAG_CATEGORY_MALE
    case 'mixed':
      return CensorshipKey.TAG_CATEGORY_MIXED
    case 'other':
      return CensorshipKey.TAG_CATEGORY_OTHER
    default:
      return null
  }
}
