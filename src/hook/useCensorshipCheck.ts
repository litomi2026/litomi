import { useMemo } from 'react'

import { CensorshipItem } from '@/backend/api/v1/censorship'
import { BLIND_TAG_VALUE_TO_LABEL, BLIND_TAG_VALUES } from '@/constants/json'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import { Manga } from '@/types/manga'

type Params = {
  manga: Manga
  censorshipsMap: Map<string, CensorshipItem> | undefined
}

export default function useMatchedCensorships({ manga, censorshipsMap }: Readonly<Params>) {
  const { artists, characters, group, series, tags, languages } = manga

  return useMemo(() => {
    let highest = CensorshipLevel.LIGHT
    const matchedLabels: string[] = []

    for (const tag of tags ?? []) {
      const tagKey = `${CensorshipKey.TAG}:${tag.value}`
      const tagMatches = censorshipsMap?.get(tagKey)

      if (BLIND_TAG_VALUES.includes(tag.value)) {
        // 기본 검열 태그
        if (!tagMatches || tagMatches.level !== CensorshipLevel.NONE) {
          matchedLabels.push(BLIND_TAG_VALUE_TO_LABEL[tag.value])
          highest = Math.max(highest, tagMatches?.level ?? CensorshipLevel.LIGHT)
        }
      } else {
        // 사용자 지정 검열 태그
        if (tagMatches && tagMatches.level !== CensorshipLevel.NONE) {
          matchedLabels.push(tag.label.split(':')[1])
          highest = Math.max(highest, tagMatches.level)
        }
      }
    }

    if (!censorshipsMap) {
      return {
        censoringReasons: Array.from(new Set(matchedLabels)),
        highestCensorshipLevel: highest,
      }
    }

    // 개별 태그: male, female, mixed, other
    for (const tag of tags ?? []) {
      const tagKey = mapTagCategoryToCensorshipKey(tag.category)
      const tagMatches = censorshipsMap.get(`${tagKey}:${tag.value}`)

      if (tagMatches && tagMatches.level !== CensorshipLevel.NONE) {
        matchedLabels.push(tag.label)
        highest = Math.max(highest, tagMatches.level)
      }
    }

    for (const artist of artists ?? []) {
      const artistKey = `${CensorshipKey.ARTIST}:${artist.value}`
      const artistMatches = censorshipsMap.get(artistKey)

      if (artistMatches && artistMatches.level !== CensorshipLevel.NONE) {
        matchedLabels.push(`작가:${artist.label}`)
        highest = Math.max(highest, artistMatches.level)
      }
    }

    for (const character of characters ?? []) {
      const characterKey = `${CensorshipKey.CHARACTER}:${character.value}`
      const characterMatches = censorshipsMap.get(characterKey)

      if (characterMatches && characterMatches.level !== CensorshipLevel.NONE) {
        matchedLabels.push(`캐릭터:${character.label}`)
        highest = Math.max(highest, characterMatches.level)
      }
    }

    for (const g of group ?? []) {
      const groupKey = `${CensorshipKey.GROUP}:${g.value}`
      const groupMatches = censorshipsMap.get(groupKey)

      if (groupMatches && groupMatches.level !== CensorshipLevel.NONE) {
        matchedLabels.push(`그룹:${g.label}`)
        highest = Math.max(highest, groupMatches.level)
      }
    }

    for (const s of series ?? []) {
      const seriesKey = `${CensorshipKey.SERIES}:${s.value}`
      const seriesMatches = censorshipsMap.get(seriesKey)

      if (seriesMatches && seriesMatches.level !== CensorshipLevel.NONE) {
        matchedLabels.push(`시리즈:${s.label}`)
        highest = Math.max(highest, seriesMatches.level)
      }
    }

    for (const language of languages ?? []) {
      const languageKey = `${CensorshipKey.LANGUAGE}:${language.value}`
      const languageMatches = censorshipsMap.get(languageKey)

      if (languageMatches && languageMatches.level !== CensorshipLevel.NONE) {
        matchedLabels.push(`${language.label}`)
        highest = Math.max(highest, languageMatches.level)
      }
    }

    if (matchedLabels.length === 0) {
      return {}
    }

    return {
      censoringReasons: Array.from(new Set(matchedLabels)),
      highestCensorshipLevel: highest,
    }
  }, [artists, censorshipsMap, characters, group, series, tags, languages])
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
