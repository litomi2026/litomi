import { eq } from 'drizzle-orm'

import { anyOf } from '../sql'
import { catalogDB } from './db'
import { mangaTable } from './schema'

const catalogMangaColumns = {
  id: mangaTable.id,
  title: mangaTable.title,
  description: mangaTable.description,
  lines: mangaTable.lines,
  type: mangaTable.type,
  count: mangaTable.count,
  createdAt: mangaTable.createdAt,
  artists: mangaTable.artists,
  characters: mangaTable.characters,
  series: mangaTable.series,
  groups: mangaTable.groups,
  languages: mangaTable.languages,
  uploader: mangaTable.uploader,
  tagValues: mangaTable.tagValues,
  tagCategories: mangaTable.tagCategories,
}

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

const catalogMangaScoringColumns = {
  id: mangaTable.id,
  title: mangaTable.title,
  type: mangaTable.type,
  count: mangaTable.count,
  createdAt: mangaTable.createdAt,
  artists: mangaTable.artists,
  characters: mangaTable.characters,
  series: mangaTable.series,
  groups: mangaTable.groups,
  languages: mangaTable.languages,
  uploader: mangaTable.uploader,
  tagValues: mangaTable.tagValues,
  tagCategories: mangaTable.tagCategories,
}

export type CatalogMangaScoringRecord = Omit<CatalogMangaRecord, 'description' | 'lines'>

export async function selectCatalogMangaRecordById(id: number): Promise<CatalogMangaRecord | null> {
  const [record] = await catalogDB.select(catalogMangaColumns).from(mangaTable).where(eq(mangaTable.id, id))

  return record ?? null
}

export async function selectCatalogMangaRecordsByIds(ids: readonly number[]): Promise<CatalogMangaRecord[]> {
  const uniqueIds = Array.from(new Set(ids))

  if (uniqueIds.length === 0) {
    return []
  }

  return await catalogDB.select(catalogMangaColumns).from(mangaTable).where(anyOf(mangaTable.id, uniqueIds))
}

export async function selectCatalogMangaScoringRecordsByIds(
  ids: readonly number[],
): Promise<CatalogMangaScoringRecord[]> {
  const uniqueIds = Array.from(new Set(ids))

  if (uniqueIds.length === 0) {
    return []
  }

  return await catalogDB.select(catalogMangaScoringColumns).from(mangaTable).where(anyOf(mangaTable.id, uniqueIds))
}
