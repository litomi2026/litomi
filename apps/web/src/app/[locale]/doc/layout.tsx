export const dynamic = 'force-static'

export default function Layout({ children }: LayoutProps<'/[locale]/doc'>) {
  return <div className="p-safe">{children}</div>
}
