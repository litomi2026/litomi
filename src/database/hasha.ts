import { MANGA_PER_PAGE } from '@/constants'
import hashaJSON from '@/database/hasha.json'
import { Manga } from '@/types/manga'

export const hashaMangas = hashaJSON as Record<string, Manga>
export const hashaMangaIds = Object.keys(hashaMangas) as (keyof typeof hashaMangas)[]
export const hashaMangaIdsDesc = hashaMangaIds.toReversed()
export const hashaMangaPages = Array.from({ length: Math.ceil(hashaMangaIds.length / MANGA_PER_PAGE) })

export const hashaMangaIdsByPage = {
  oldest: hashaMangaPages.map((_, page) => hashaMangaIds.slice(page * MANGA_PER_PAGE, (page + 1) * MANGA_PER_PAGE)),
  latest: hashaMangaPages.map((_, page) => hashaMangaIdsDesc.slice(page * MANGA_PER_PAGE, (page + 1) * MANGA_PER_PAGE)),
} as const

export function isHashaMangaKey(key: string): key is keyof typeof hashaMangas {
  return key in hashaMangas
}
