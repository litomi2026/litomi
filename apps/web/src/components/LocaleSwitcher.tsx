'use client'

import { LOCALE_LANGUAGE_TAGS, LOCALE_NATIVE_NAMES, PUBLIC_LOCALES } from '@litomi/domain/locale'
import { useLocale } from 'next-intl'
import { twMerge } from 'tailwind-merge'

import { Link, usePathname } from '@/i18n/navigation'

type Props = {
  className?: string
}

const itemClassName = 'rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition'

export default function LocaleSwitcher({ className }: Props) {
  const currentLocale = useLocale()
  const pathname = usePathname()

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
        const label = LOCALE_NATIVE_NAMES[locale]
        const lang = LOCALE_LANGUAGE_TAGS[locale]

        if (locale === currentLocale) {
          return (
            <span
              aria-current="page"
              className={twMerge(itemClassName, 'bg-foreground text-background shadow')}
              key={locale}
              lang={lang}
            >
              {label}
            </span>
          )
        }

        return (
          <Link
            className={twMerge(
              itemClassName,
              'text-zinc-400 hover:bg-zinc-800 hover:text-foreground',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            )}
            href={pathname}
            key={locale}
            lang={lang}
            locale={locale}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
