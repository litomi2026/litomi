import 'server-only'

import type { Manga } from '@litomi/domain/types/manga'

import { catalogMangaRecordsToMangaMap } from '@litomi/catalog/manga'
import { selectCatalogMangaRecordsByIds } from '@litomi/db/query/catalog-manga'

export async function getCatalogMangaMap(mangaIds: readonly number[]): Promise<Map<number, Manga>> {
  try {
    const records = await selectCatalogMangaRecordsByIds(mangaIds)
    return catalogMangaRecordsToMangaMap(records)
  } catch (error) {
    console.error('Catalog manga lookup failed:', error)
    return new Map()
  }
}
