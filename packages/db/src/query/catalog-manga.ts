import 'server-only'
import { eq, inArray } from 'drizzle-orm'

import { catalogDB } from '../catalog/db'
import { mangaTable } from '../catalog/schema'

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

export async function selectCatalogMangaRecordById(id: number): Promise<CatalogMangaRecord | null> {
  const [record] = await catalogDB.select(catalogMangaColumns).from(mangaTable).where(eq(mangaTable.id, id))

  return record ?? null
}

export async function selectCatalogMangaRecordsByIds(ids: readonly number[]): Promise<CatalogMangaRecord[]> {
  const uniqueIds = Array.from(new Set(ids))

  if (uniqueIds.length === 0) {
    return []
  }

  return await catalogDB.select(catalogMangaColumns).from(mangaTable).where(inArray(mangaTable.id, uniqueIds))
}
