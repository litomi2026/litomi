import type { Locale } from '@litomi/domain/locale'

import { MANGA_TYPE_VALUE_BY_ID, type Manga, tagCategoryIntToName } from '@litomi/domain/manga/model'

import { translateArtistList } from './translation/artist'
import { translateCharacterList } from './translation/character'
import { translateGroupList } from './translation/group'
import { translateLanguageList } from './translation/language'
import { translateSeriesList } from './translation/series'
import { translateTag } from './translation/tag'
import { translateType } from './translation/type'

export type CatalogMangaRecord = {
  id: number
  title: string
  description: string | null
  lines: string[]
  type: number
  count: number | null
  createdAt: Date | null
  artists: string[]
  characters: string[]
  series: string[]
  groups: string[]
  languages: string[]
  uploader: string | null
  tagValues: string[]
  tagCategories: number[]
}

export function catalogMangaRecordsToMangaMap(records: CatalogMangaRecord[], locale: Locale) {
  return new Map(records.map((record) => [record.id, catalogMangaRecordToManga(record, locale)]))
}

export function catalogMangaRecordToManga(record: CatalogMangaRecord, locale: Locale): Manga {
  return {
    id: record.id,
    title: record.title,
    images: [],
    description: record.description ?? undefined,
    lines: record.lines,
    count: record.count ?? undefined,
    date: record.createdAt?.toISOString(),
    type: translateType(MANGA_TYPE_VALUE_BY_ID[record.type], locale),
    artists: translateArtistList(record.artists, locale),
    characters: translateCharacterList(record.characters, locale),
    series: translateSeriesList(record.series, locale),
    group: translateGroupList(record.groups, locale),
    languages: translateLanguageList(record.languages, locale),
    uploader: record.uploader ?? undefined,

    tags: record.tagValues
      .map((value, index) => ({
        value,
        category: record.tagCategories[index] ?? 3,
      }))
      .sort((a, b) => a.category - b.category)
      .map(({ category, value }) => translateTag(tagCategoryIntToName[category] ?? 'other', value, locale))
      .sort((a, b) => {
        if (a.category === b.category) {
          return a.label.localeCompare(b.label)
        }

        return 0
      }),
  }
}
