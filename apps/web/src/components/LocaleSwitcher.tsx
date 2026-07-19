'use client'

import { LOCALE_LANGUAGE_TAGS, LOCALE_NATIVE_NAMES, PUBLIC_LOCALES, type PublicLocale } from '@litomi/domain/locale'
import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { twMerge } from 'tailwind-merge'

import { usePathname, useRouter } from '@/i18n/navigation'

type Props = {
  className?: string
}

export default function LocaleSwitcher({ className }: Props) {
  const [isPending, startTransition] = useTransition()
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function handleLocaleChange(nextLocale: PublicLocale) {
    if (nextLocale === currentLocale || isPending) {
      return
    }

    startTransition(() => {
      const { hash, search } = window.location
      router.push(`${pathname}${search}${hash}`, { locale: nextLocale })
    })
  }

  return (
    <div
      aria-label="언어 변경 / Change language"
      className={twMerge(
        'inline-flex items-center gap-0.5 rounded-full border border-zinc-700/80 bg-background/80 p-1 shadow-lg shadow-black/20 backdrop-blur',
        className,
      )}
      role="group"
    >
      {PUBLIC_LOCALES.map((locale) => {
        const isSelected = locale === currentLocale

        return (
          <button
            aria-current={isSelected ? 'true' : undefined}
            className={twMerge(
              'rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60',
              isSelected
                ? 'bg-foreground text-background shadow'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-foreground',
            )}
            disabled={isPending}
            key={locale}
            lang={LOCALE_LANGUAGE_TAGS[locale]}
            onClick={() => handleLocaleChange(locale)}
            type="button"
          >
            {LOCALE_NATIVE_NAMES[locale]}
          </button>
        )
      })}
    </div>
  )
}
