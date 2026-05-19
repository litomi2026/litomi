import 'server-only'
import { catalogMangaRecordToManga } from '@litomi/catalog/manga'
import { selectCatalogMangaRecordById } from '@litomi/db/query/catalog-manga'
import { cache } from 'react'

export const getManga = cache(async (id: number) => {
  try {
    const record = await selectCatalogMangaRecordById(id)
    return record ? catalogMangaRecordToManga(record) : null
  } catch {
    return null
  }
})
