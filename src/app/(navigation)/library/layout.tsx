import LibraryNavigation from './LibraryNavigation'

export default function LibraryLayout({ children }: LayoutProps<'/library'>) {
  return <LibraryNavigation>{children}</LibraryNavigation>
}
