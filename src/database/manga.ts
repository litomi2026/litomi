import { MANGA_PER_PAGE } from '@/constants'
import mangasJSON from '@/database/manga.json'
import { Manga } from '@/types/manga'

export const mangas = mangasJSON as Record<string, Manga>
export const mangaIds = Object.keys(mangas) as (keyof typeof mangas)[]
export const mangaIdsDesc = mangaIds.toReversed()
export const pages = Array.from({ length: Math.ceil(mangaIds.length / MANGA_PER_PAGE) })

export const paginatedMangaIds = {
  id: {
    asc: pages.map((_, page) => mangaIds.slice(page * MANGA_PER_PAGE, (page + 1) * MANGA_PER_PAGE)),
    desc: pages.map((_, page) => mangaIdsDesc.slice(page * MANGA_PER_PAGE, (page + 1) * MANGA_PER_PAGE)),
  },
} as const

export function isMangaKey(key: string): key is keyof typeof mangas {
  return key in mangas
}
