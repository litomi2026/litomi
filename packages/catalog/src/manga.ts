import type { Manga } from '@litomi/domain/manga/model'

import { Locale } from '@litomi/domain/locale'
import { tagCategoryIntToName } from '@litomi/domain/manga/model'

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

const typeMap: Record<number, string> = {
  1: 'doujinshi',
  2: 'manga',
  3: 'artist_cg',
  4: 'game_cg',
  5: 'western',
  6: 'image_set',
  7: 'non-h',
  8: 'cosplay',
  9: 'asian',
  10: 'misc',
  11: 'private',
}

export function catalogMangaRecordsToMangaMap(records: readonly CatalogMangaRecord[]): Map<number, Manga> {
  return new Map(records.map((record) => [record.id, catalogMangaRecordToManga(record)]))
}

export function catalogMangaRecordToManga(record: CatalogMangaRecord): Manga {
  const locale = Locale.KO

  return {
    id: record.id,
    title: record.title,
    images: [],
    description: record.description ?? undefined,
    lines: record.lines,
    count: record.count ?? undefined,
    date: record.createdAt?.toISOString(),
    type: translateType(typeMap[record.type], locale),
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
