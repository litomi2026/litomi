export default function Layout({ children }: LayoutProps<'/notification'>) {
  return <div className="flex-1 flex flex-col p-4 sm:p-6">{children}</div>
}
