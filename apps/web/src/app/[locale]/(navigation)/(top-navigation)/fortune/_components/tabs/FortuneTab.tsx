import { Flame } from 'lucide-react'

import type { Fortune } from '../../_lib/sexFortuneTypes'

export function FortuneTab({
  copy,
  copied,
  fortune,
  shareText,
}: {
  copy: (text: string) => void
  copied: boolean
  fortune: Fortune
  shareText: string
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/7 bg-white/3 p-4">
          <p className="text-sm font-semibold text-zinc-200">오늘의 팁</p>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{fortune.tip}</p>
        </div>
        <div className="rounded-xl border border-white/7 bg-white/3 p-4">
          <p className="text-sm font-semibold text-zinc-200">오늘의 주의</p>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{fortune.caution}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/10 active:brightness-90"
          onClick={() => copy(shareText)}
          type="button"
        >
          <Flame className="size-4" />
          {copied ? '복사됐어요' : '결과 복사'}
        </button>
      </div>
    </div>
  )
}
