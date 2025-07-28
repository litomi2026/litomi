import { BookmarkSource } from '@/database/enum'

export type BookmarkDetails = {
  source: BookmarkSource
  mangaId: number
}

export function generateBookmarkKey(bookmark: BookmarkDetails): string {
  return `${bookmark.source}:${bookmark.mangaId}`
}
