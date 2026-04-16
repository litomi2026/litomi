import BookmarkImportModal from './bookmark/BookmarkImportButton/BookmarkImportModal'
import BookmarkUploadModal from './bookmark/BookmarkUploadButton/BookmarkUploadModal'
import LibraryItemImportModal from './LibraryItemImportButton/LibraryItemImportModal'
import LibraryLayout from './LibraryLayout'

export default function Layout({ children }: LayoutProps<'/library'>) {
  return (
    <LibraryLayout>
      {children}
      <BookmarkUploadModal />
      <LibraryItemImportModal />
      <BookmarkImportModal />
    </LibraryLayout>
  )
}
