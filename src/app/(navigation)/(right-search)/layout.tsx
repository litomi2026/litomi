export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex grow min-h-full lg:gap-8 2xl:gap-10">
      <div className="flex min-w-0 flex-col grow lg:border-r-2">{children}</div>
      <div className="hidden text-center lg:block w-2xs shrink-0 bg-zinc-800">검색</div>
    </div>
  )
}
