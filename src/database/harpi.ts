import harpiJSON from '@/database/harpi.json'
import { Manga } from '@/types/manga'

export const harpiMangas = harpiJSON as unknown as Record<string, Manga>
export const harpiMangaIds = Object.keys(harpiMangas) as (keyof typeof harpiMangas)[]
