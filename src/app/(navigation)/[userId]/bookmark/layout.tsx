import type { BaseLayoutProps } from '@/types/nextjs'

import IconInfo from '@/components/icons/IconInfo'
import Tooltip from '@/components/ui/Tooltip'

export default async function Layout({ children }: BaseLayoutProps) {
  return (
    <main className="flex flex-col gap-2 p-2 h-full">
      <h1 className="text-lg font-bold text-center">북마크</h1>
      <div className="flex items-center justify-center">
        <BookmarkTooltip />
      </div>
      {children}
    </main>
  )
}

function BookmarkTooltip() {
  return (
    <Tooltip position="bottom">
      <div className="flex items-center gap-1">
        <p className="text-xs md:text-sm">북마크 반영이 안 돼요!</p>
        <IconInfo className="w-3 md:w-4" />
      </div>
      <div className="rounded-xl border-2 border-zinc-700 bg-background min-w-3xs p-3 text-sm">
        <p>
          클라우드 비용 절감을 위해 서버 트래픽을 제한하고 있어서 실시간 반영이 어려워요. 변경 사항이 실제로 반영될
          때까지 최대 <span className="whitespace-nowrap">1분</span> 정도 걸릴 수 있어요
        </p>
      </div>
    </Tooltip>
  )
}
