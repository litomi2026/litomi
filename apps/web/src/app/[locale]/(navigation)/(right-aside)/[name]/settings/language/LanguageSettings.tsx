'use client'

import { Locale } from '@litomi/domain/locale'
import { KR, US } from 'country-flag-icons/react/3x2'
import { Check } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { twMerge } from 'tailwind-merge'

import { usePathname, useRouter } from '@/i18n/navigation'

const LANGUAGES = [
  { code: Locale.KO, label: '한국어', Flag: KR },
  { code: Locale.EN, label: 'English', Flag: US },
  // { code: Locale.JA, label: '日本語', Flag: JP },
  // { code: Locale.ZH_CN, label: '简体中文', Flag: CN },
  // { code: Locale.ZH_TW, label: '繁體中文', Flag: TW },
] as const

type LanguageCode = (typeof LANGUAGES)[number]['code']

export default function LanguageSettings() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const [isPending, startTransition] = useTransition()

  function handleLanguageChange(language: LanguageCode) {
    if (language === currentLocale || isPending) {
      return
    }

    startTransition(() => {
      const url = new URL(window.location.href)
      router.push(`${pathname}${url.search}${url.hash}`, { locale: language })
    })
  }

  return (
    <div className="grid gap-2">
      {LANGUAGES.map(({ code, label, Flag }) => {
        const isSelected = currentLocale === code

        return (
          <button
            aria-pressed={isSelected}
            className={twMerge(
              'flex items-center gap-4 p-4 rounded-lg border-2 transition text-left border-zinc-700',
              'hover:border-zinc-600 hover:bg-zinc-800/30 aria-pressed:border-brand aria-pressed:bg-zinc-800/50',
            )}
            disabled={isPending}
            key={code}
            onClick={() => handleLanguageChange(code)}
            type="button"
          >
            <Flag className="size-6 rounded-sm shrink-0" />
            <span className="flex-1 font-medium">{label}</span>
            {isSelected && <Check className="size-5 text-brand shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
