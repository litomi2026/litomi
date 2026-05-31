import { BookmarkExportData } from './types'

export function validateBookmarkData(data: unknown): data is BookmarkExportData {
  if (!data || typeof data !== 'object') {
    return false
  }

  const bookmarkData = data as { bookmarks?: unknown }
  return !!(bookmarkData.bookmarks && Array.isArray(bookmarkData.bookmarks))
}
