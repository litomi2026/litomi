import type { ReactNode } from 'react'

import { Heart, Sparkles, Zap } from 'lucide-react'

import type { SexFortuneTab } from '../_lib/sexFortuneTypes'

const TABS: { id: SexFortuneTab; label: string; icon: ReactNode }[] = [
  { id: 'course', label: '코스', icon: <Heart className="size-4" /> },
  { id: 'fortune', label: '운세', icon: <Sparkles className="size-4" /> },
  { id: 'special', label: '특별', icon: <Zap className="size-4" /> },
]

export function SexFortuneTabNav({
  activeTab,
  onChange,
}: {
  activeTab: SexFortuneTab
  onChange: (tab: SexFortuneTab) => void
}) {
  return (
    <div
      aria-label="섹스 운세 탭"
      className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      role="tablist"
    >
      {TABS.map((tab) => (
        <button
          aria-selected={activeTab === tab.id}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/4 hover:text-white/90 aria-selected:bg-white/5 aria-selected:text-white/90 aria-selected:shadow-[inset_0_-2px_0_var(--color-brand),inset_0_0_0_1px_rgba(255,255,255,0.08)] aria-selected:pointer-events-none transition"
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          type="button"
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
