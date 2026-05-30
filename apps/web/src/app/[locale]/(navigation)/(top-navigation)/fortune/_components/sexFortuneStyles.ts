import type { CSSProperties } from 'react'

export const LIBO_PAGE_LAYOUT = {
  container: 'flex flex-col grow gap-4 max-w-3xl mx-auto w-full sm:p-2 md:gap-6',
  heroCardReserved: 'h-32',
  tabsReserved: 'h-11',
  panelReserved: 'flex-1',
} as const

type AccentCardStyle = CSSProperties & {
  ['--accent']?: string
}

export function getAccentCardStyle(accent: string): AccentCardStyle {
  return {
    '--accent': accent,
    background: `
      radial-gradient(120% 120% at 18% 28%, color-mix(in oklab, var(--accent) 18%, transparent) 0%, transparent 56%),
      radial-gradient(100% 90% at 82% 12%, color-mix(in oklab, var(--accent) 12%, transparent) 0%, transparent 60%),
      radial-gradient(110% 100% at 70% 92%, color-mix(in oklab, var(--accent) 9%, transparent) 0%, transparent 65%),
      rgba(255, 255, 255, 0.04)
    `,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 1px 0 rgba(0, 0, 0, 0.25)
    `,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  }
}

export const SECTION_CARD_CLASS =
  'rounded-2xl p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_0_rgba(0,0,0,0.25)]'

export const SECTION_ITEM_CLASS =
  'flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'

export const COPY_BAR_CLASS =
  'rounded-xl bg-white/4 border border-white/7 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex flex-wrap items-center gap-2'

export const COPY_BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/10 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15'
