export default async function Layout({ children }: LayoutProps<'/[locale]/[name]/censor'>) {
  return <main className="flex flex-col gap-2 flex-1 p-2 h-full">{children}</main>
}
