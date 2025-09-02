export type BookmarkExportData = {
  exportedAt: Date
  totalCount: number
  bookmarks: ExportedBookmark[]
}

export type ImportState = 'complete' | 'idle' | 'importing' | 'preview'

type ExportedBookmark = {
  mangaId: number
  createdAt: Date
}
