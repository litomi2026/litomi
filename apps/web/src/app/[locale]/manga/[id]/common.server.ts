import 'server-only'
import { catalogMangaRecordToManga } from '@litomi/catalog/manga'
import { selectCatalogMangaRecordById } from '@litomi/db/query/catalog-manga'
import { cache } from 'react'

import { SupportedLocale } from '@/i18n/routing'

export const getManga = cache(async (id: number, locale: SupportedLocale) => {
  try {
    const record = await selectCatalogMangaRecordById(id)
    return record ? catalogMangaRecordToManga(record, locale) : null
  } catch {
    return null
  }
})
