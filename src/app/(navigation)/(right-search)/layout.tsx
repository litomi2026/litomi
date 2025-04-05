import type { BaseLayoutProps } from '@/types/nextjs'

export default function Layout({ children }: BaseLayoutProps) {
  return (
    <div className="flex min-h-full lg:gap-8 2xl:gap-10">
      <div className="flex flex-col grow lg:border-r-2">{children}</div>
      <div className="hidden text-center lg:block w-[300px] shrink-0 bg-zinc-800">검색</div>
    </div>
  )
}
