import mangasJSON from '@/database/manga.json'

export const mangas = mangasJSON
export const mangaIds = Object.keys(mangasJSON).sort((a, b) => +b - +a) as (keyof typeof mangas)[]

export function isMangaKey(key: string): key is keyof typeof mangas {
  return key in mangas
}
