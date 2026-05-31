import type { CensorshipItem } from '@litomi/contracts'
import type { Manga } from '@litomi/domain/manga/model'

import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'

import { DEFAULT_CENSORSHIP_VALUES } from '@/app/[locale]/(navigation)/(right-aside)/[name]/censor/constants'

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

  for (const tag of tags ?? []) {
    const tagKey = `${CensorshipKey.TAG}:${tag.value}`
    const tagMatches = censorshipsMap?.get(tagKey)

    if (DEFAULT_CENSORSHIP_VALUES.some((item) => item.value === tag.value)) {
      if (tagMatches?.level === CensorshipLevel.NONE) {
        continue
      }

      if (tagMatches) {
        matchedLabels.push(getTagDisplayLabel(tag.label))
        highest = Math.max(highest, tagMatches.level)
      } else if (defaultCensorshipEnabled) {
        matchedLabels.push(getTagDisplayLabel(tag.label))
        highest = Math.max(highest, CensorshipLevel.LIGHT)
      }
    } else {
      if (tagMatches && tagMatches.level !== CensorshipLevel.NONE) {
        matchedLabels.push(getTagDisplayLabel(tag.label))
        highest = Math.max(highest, tagMatches.level)
      }
    }
  }

  if (!censorshipsMap) {
    return createCensorshipMatch(matchedLabels, highest)
  }

  // 개별 태그: male, female, mixed, other
  for (const tag of tags ?? []) {
    const tagKey = mapTagCategoryToCensorshipKey(tag.category)
    const tagMatches = censorshipsMap.get(`${tagKey}:${tag.value}`)

    if (tagMatches && tagMatches.level !== CensorshipLevel.NONE) {
      matchedLabels.push(getTagDisplayLabel(tag.label))
      highest = Math.max(highest, tagMatches.level)
    }
  }

  for (const artist of artists ?? []) {
    const artistKey = `${CensorshipKey.ARTIST}:${artist.value}`
    const artistMatches = censorshipsMap.get(artistKey)

    if (artistMatches && artistMatches.level !== CensorshipLevel.NONE) {
      matchedLabels.push(artist.label)
      highest = Math.max(highest, artistMatches.level)
    }
  }

  for (const character of characters ?? []) {
    const characterKey = `${CensorshipKey.CHARACTER}:${character.value}`
    const characterMatches = censorshipsMap.get(characterKey)

    if (characterMatches && characterMatches.level !== CensorshipLevel.NONE) {
      matchedLabels.push(character.label)
      highest = Math.max(highest, characterMatches.level)
    }
  }

  for (const g of group ?? []) {
    const groupKey = `${CensorshipKey.GROUP}:${g.value}`
    const groupMatches = censorshipsMap.get(groupKey)

    if (groupMatches && groupMatches.level !== CensorshipLevel.NONE) {
      matchedLabels.push(g.label)
      highest = Math.max(highest, groupMatches.level)
    }
  }

  for (const s of series ?? []) {
    const seriesKey = `${CensorshipKey.SERIES}:${s.value}`
    const seriesMatches = censorshipsMap.get(seriesKey)

    if (seriesMatches && seriesMatches.level !== CensorshipLevel.NONE) {
      matchedLabels.push(s.label)
      highest = Math.max(highest, seriesMatches.level)
    }
  }

  for (const language of languages ?? []) {
    const languageKey = `${CensorshipKey.LANGUAGE}:${language.value}`
    const languageMatches = censorshipsMap.get(languageKey)

    if (languageMatches && languageMatches.level !== CensorshipLevel.NONE) {
      matchedLabels.push(language.label)
      highest = Math.max(highest, languageMatches.level)
    }
  }

  if (uploader) {
    const uploaderKey = `${CensorshipKey.UPLOADER}:${uploader}`
    const uploaderMatches = censorshipsMap.get(uploaderKey)

    if (uploaderMatches && uploaderMatches.level !== CensorshipLevel.NONE) {
      matchedLabels.push(uploader)
      highest = Math.max(highest, uploaderMatches.level)
    }
  }

  if (type) {
    const typeKey = `${CensorshipKey.TYPE}:${type.value}`
    const typeMatches = censorshipsMap.get(typeKey)

    if (typeMatches && typeMatches.level !== CensorshipLevel.NONE) {
      matchedLabels.push(type.label)
      highest = Math.max(highest, typeMatches.level)
    }
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

function mapTagCategoryToCensorshipKey(category: string) {
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
      return ''
  }
}
