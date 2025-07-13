import { BookmarkWithSource } from '@/app/api/bookmarks/route'

export function generateBookmarkKey(bookmark: BookmarkWithSource): string {
  return `${bookmark.source}:${bookmark.mangaId}`
}
