import LiboNavigation from './LiboNavigation'

export default function LiboLayout({ children }: LayoutProps<'/libo'>) {
  return <LiboNavigation>{children}</LiboNavigation>
}
