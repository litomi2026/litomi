'use client'

import { LOCALE_LANGUAGE_TAGS, LOCALE_NATIVE_NAMES, PUBLIC_LOCALES, type PublicLocale } from '@litomi/domain/locale'
import { Check } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { twMerge } from 'tailwind-merge'

import { usePathname, useRouter } from '@/i18n/navigation'

export default function LanguageSettings() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const [isPending, startTransition] = useTransition()

  function handleLanguageChange(language: PublicLocale) {
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
      {PUBLIC_LOCALES.map((code) => {
        const isSelected = currentLocale === code
        const label = LOCALE_NATIVE_NAMES[code]

        return (
          <button
            aria-pressed={isSelected}
            className={twMerge(
              'flex items-center gap-4 p-4 rounded-lg border-2 transition text-left border-zinc-700',
              'hover:border-zinc-600 hover:bg-zinc-800/30 aria-pressed:border-brand aria-pressed:bg-zinc-800/50',
            )}
            disabled={isPending}
            key={code}
            lang={LOCALE_LANGUAGE_TAGS[code]}
            onClick={() => handleLanguageChange(code)}
            type="button"
          >
            <span className="flex-1 font-medium">{label}</span>
            {isSelected && <Check className="size-5 text-brand shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
