import { toast } from 'sonner'

import { MAX_BOOKMARK_FILE_SIZE } from '@/constants/policy'

import { BookmarkExportData } from '../constants'

export function validateBookmarkData(data: unknown): data is BookmarkExportData {
  if (!data || typeof data !== 'object') {
    return false
  }

  const bookmarkData = data as { bookmarks?: unknown }
  return !!(bookmarkData.bookmarks && Array.isArray(bookmarkData.bookmarks))
}

export function validateFile(file: File): boolean {
  if (file.type !== 'application/json') {
    toast.error('JSON 파일만 가능해요')
    return false
  }

  if (file.size > MAX_BOOKMARK_FILE_SIZE) {
    toast.error('파일 크기는 1MB를 초과할 수 없어요. 북마크가 많다면 파일을 쪼개주세요.')
    return false
  }

  return true
}
