'use client'

import { Check, Moon, Palette, Sparkles, Sun } from 'lucide-react'

import { Theme, useThemeStore } from '@/store/theme'

const THEMES = [
  {
    value: Theme.LIGHT,
    label: '라이트',
    description: '밝고 깔끔한 화이트 테마',
    Icon: Sun,
  },
  {
    value: Theme.DARK,
    label: '다크',
    description: '눈이 편안한 다크 테마',
    Icon: Moon,
  },
  {
    value: Theme.NEON,
    label: '네온',
    description: '생동감 넘치는 사이버펑크 테마',
    Icon: Sparkles,
  },
  {
    value: Theme.RETRO,
    label: '레트로',
    description: '따뜻한 빈티지 감성 테마',
    Icon: Palette,
  },
] as const

export default function ThemeSettings() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="grid gap-2">
      {THEMES.map(({ value, label, description, Icon }) => {
        const isSelected = theme === value

        return (
          <button
            aria-pressed={isSelected}
            className="flex items-center gap-4 p-4 rounded-lg border-2 transition text-left border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30
            aria-pressed:border-brand-end aria-pressed:bg-zinc-800/50"
            key={value}
            onClick={() => setTheme(value)}
            type="button"
          >
            <div
              className="size-10 rounded-lg shrink-0 flex items-center justify-center border border-zinc-700 bg-background"
              data-theme={value}
            >
              <Icon className="size-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{label}</div>
              <div className="text-sm text-zinc-400">{description}</div>
            </div>
            {isSelected && <Check className="size-5 text-brand-end shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
