import { MANGA_PER_PAGE } from '@/constants'
import harpiJSON from '@/database/harpi.json'
import { Manga } from '@/types/manga'

export const harpiMangas = harpiJSON as unknown as Record<string, Manga>
export const harpiMangaIds = Object.keys(harpiMangas) as (keyof typeof harpiMangas)[]
export const harpiMangaIdsDesc = harpiMangaIds.toReversed()
export const harpiMangaPages = Array.from({ length: Math.ceil(harpiMangaIds.length / MANGA_PER_PAGE) })

export const harpiMangaIdsByPage = {
  latest: harpiMangaPages.map((_, page) => harpiMangaIdsDesc.slice(page * MANGA_PER_PAGE, (page + 1) * MANGA_PER_PAGE)),
  oldest: harpiMangaPages.map((_, page) => harpiMangaIds.slice(page * MANGA_PER_PAGE, (page + 1) * MANGA_PER_PAGE)),
  popular: [],
} as const

export function isHarpiMangaKey(key: string): key is keyof typeof harpiMangas {
  return key in harpiMangas
}
