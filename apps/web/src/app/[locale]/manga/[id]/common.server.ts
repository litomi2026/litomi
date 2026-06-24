import 'server-only'

import { catalogMangaRecordToManga } from '@litomi/catalog/manga'
import { selectCatalogMangaRecordById } from '@litomi/db/query/catalog-manga'
import type { PublicLocale } from '@litomi/domain/locale'
import { cache } from 'react'

export const getManga = cache(async (id: number, locale: PublicLocale) => {
  try {
    const record = await selectCatalogMangaRecordById(id)
    return record ? catalogMangaRecordToManga(record, locale) : null
  } catch {
    return null
  }
})
