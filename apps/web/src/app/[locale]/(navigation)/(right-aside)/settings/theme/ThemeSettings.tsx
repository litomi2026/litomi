'use client'

import { Check, Monitor, Moon, Palette, Sparkles, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { Theme } from '@/theme'

const SYSTEM_THEME = 'system'

const THEME_OPTIONS = [
  {
    value: SYSTEM_THEME,
    Icon: Monitor,
  },
  {
    value: Theme.LIGHT,
    Icon: Sun,
  },
  {
    value: Theme.DARK,
    Icon: Moon,
  },
  {
    value: Theme.NEON,
    Icon: Sparkles,
  },
  {
    value: Theme.RETRO,
    Icon: Palette,
  },
] as const

export default function ThemeSettings() {
  const { theme, setTheme, systemTheme } = useTheme()
  const t = useTranslations('Settings.theme')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="grid gap-2">
      {THEME_OPTIONS.map(({ value, Icon }) => {
        const isSelected = mounted && theme === value
        const swatchTheme = value === SYSTEM_THEME ? systemTheme : value

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
              data-theme={swatchTheme}
            >
              <Icon className="size-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{t(`options.${value}.label`)}</div>
              <div className="text-sm text-zinc-400">{t(`options.${value}.description`)}</div>
            </div>
            {isSelected && <Check className="size-5 text-brand shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
