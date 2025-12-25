export type BookmarkExportData = {
  exportedAt: string
  totalCount: number
  bookmarks: ExportedBookmark[]
}

export type ImportMode = 'merge' | 'replace'

export type ImportResult = {
  imported: number
  skipped: number
}

export type ImportState = 'complete' | 'idle' | 'importing' | 'preview'

type ExportedBookmark = {
  mangaId: number
  createdAt: string
}
