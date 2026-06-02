export default async function Layout({ children }: LayoutProps<'/[locale]/censor'>) {
  return <main className="flex flex-col gap-2 flex-1 p-2 h-full md:p-4">{children}</main>
}
