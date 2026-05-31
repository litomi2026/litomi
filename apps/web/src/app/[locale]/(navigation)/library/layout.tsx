import BookmarkImportModal from './bookmark/BookmarkImportButton/BookmarkImportModal'
import BookmarkUploadModal from './bookmark/BookmarkUploadButton/BookmarkUploadModal'
import LibraryItemImportModal from './LibraryItemImportButton/LibraryItemImportModal'
import LibraryLayout from './LibraryLayout'

export default function Layout({ children }: LayoutProps<'/[locale]/library'>) {
  return (
    <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
      <LibraryLayout>{children}</LibraryLayout>
      <BookmarkUploadModal />
      <LibraryItemImportModal />
      <BookmarkImportModal />
    </div>
  )
}
