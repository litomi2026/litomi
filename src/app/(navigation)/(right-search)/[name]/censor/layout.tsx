export default async function Layout({ children }: LayoutProps<'/[name]/censor'>) {
  return <main className="flex flex-col gap-2 p-2 h-full">{children}</main>
}
