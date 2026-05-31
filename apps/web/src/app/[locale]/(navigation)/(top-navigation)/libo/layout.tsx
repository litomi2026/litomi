import LiboNavigation from './LiboNavigation'

export default function LiboLayout({ children }: LayoutProps<'/[locale]/libo'>) {
  return <LiboNavigation>{children}</LiboNavigation>
}
