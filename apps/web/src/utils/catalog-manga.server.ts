import 'server-only'

import { catalogMangaRecordsToMangaMap } from '@litomi/catalog/manga'
import { selectCatalogMangaRecordsByIds } from '@litomi/db/catalog/query'
import type { PublicLocale } from '@litomi/domain/locale'
import type { Manga } from '@litomi/domain/manga/model'

export async function getCatalogMangaMap(mangaIds: number[], locale: PublicLocale): Promise<Map<number, Manga>> {
  try {
    const records = await selectCatalogMangaRecordsByIds(mangaIds)
    return catalogMangaRecordsToMangaMap(records, locale)
  } catch (error) {
    console.error('Catalog manga lookup failed:', error)
    return new Map()
  }
}
