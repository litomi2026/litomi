'use client'

import { Check, Moon, Palette, Sparkles, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

import { Theme, useThemeStore } from '@/store/theme'

const THEMES = [
  {
    value: Theme.LIGHT,
    messageKey: 'light',
    Icon: Sun,
  },
  {
    value: Theme.DARK,
    messageKey: 'dark',
    Icon: Moon,
  },
  {
    value: Theme.NEON,
    messageKey: 'neon',
    Icon: Sparkles,
  },
  {
    value: Theme.RETRO,
    messageKey: 'retro',
    Icon: Palette,
  },
] as const

export default function ThemeSettings() {
  const { theme, setTheme } = useThemeStore()
  const t = useTranslations('Settings.theme')

  return (
    <div className="grid gap-2">
      {THEMES.map(({ value, messageKey, Icon }) => {
        const isSelected = theme === value

        return (
          <button
            aria-pressed={isSelected}
            className={twMerge(
              'flex items-center gap-4 p-4 rounded-lg border-2 transition text-left border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30',
              'aria-pressed:border-brand aria-pressed:bg-zinc-800/50',
            )}
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
              <div className="font-medium">{t(`options.${messageKey}.label`)}</div>
              <div className="text-sm text-zinc-400">{t(`options.${messageKey}.description`)}</div>
            </div>
            {isSelected && <Check className="size-5 text-brand shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
