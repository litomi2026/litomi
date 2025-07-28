import { toast } from 'sonner'

import { BookmarkExportData } from '../constants'

export const MAX_FILE_SIZE = 1024 * 1024 // 1MB
export const ACCEPTED_FILE_TYPE = 'application/json'

export function validateBookmarkData(data: unknown): data is BookmarkExportData {
  if (!data || typeof data !== 'object') {
    return false
  }

  const bookmarkData = data as { bookmarks?: unknown }
  return !!(bookmarkData.bookmarks && Array.isArray(bookmarkData.bookmarks))
}

export function validateFile(file: File): boolean {
  if (file.type !== ACCEPTED_FILE_TYPE) {
    toast.error('JSON 파일만 가능해요')
    return false
  }

  if (file.size > MAX_FILE_SIZE) {
    toast.error('파일 크기는 1MB를 초과할 수 없어요. 북마크가 많다면 파일을 쪼개주세요.')
    return false
  }

  return true
}
