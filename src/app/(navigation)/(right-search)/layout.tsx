import type { BaseLayoutProps } from '@/types/nextjs'

export default function Layout({ children }: BaseLayoutProps) {
  return (
    <div className="grid h-full lg:grid-cols-[1fr_300px] lg:gap-8 2xl:gap-10">
      <div className="lg:border-r-2">{children}</div>
      <div className="hidden text-center lg:block bg-zinc-800">검색</div>
    </div>
  )
}
