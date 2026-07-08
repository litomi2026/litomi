import { Flame } from 'lucide-react'

import type { FortuneStreak } from '../_lib/storage'

export function StreakBanner({ streak }: { streak: FortuneStreak }) {
  const count = Math.max(streak.count, 0)

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/4 px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        <Flame className="size-4 text-orange-400" />
        <p className="text-sm text-zinc-200">
          <span className="font-bold text-orange-300 tabular-nums">{count}일</span> 연속 확인 중
        </p>
      </div>
      <p className="text-xs text-zinc-500 tabular-nums">최고 {Math.max(streak.best, count)}일</p>
    </div>
  )
}
