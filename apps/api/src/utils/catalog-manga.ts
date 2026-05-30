import type { Locale } from '@litomi/domain/locale'
import type { Manga } from '@litomi/domain/manga/model'

import { catalogMangaRecordsToMangaMap } from '@litomi/catalog/manga'
import { selectCatalogMangaRecordsByIds } from '@litomi/db/query/catalog-manga'

export async function getCatalogMangaMap(mangaIds: readonly number[], locale: Locale): Promise<Map<number, Manga>> {
  try {
    const records = await selectCatalogMangaRecordsByIds(mangaIds)
    return catalogMangaRecordsToMangaMap(records, locale)
  } catch (error) {
    console.error('Catalog manga lookup failed:', error)
    return new Map()
  }
}
