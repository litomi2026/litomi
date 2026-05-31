'use client'

import { LOCALE_LANGUAGE_TAGS, LOCALE_NATIVE_NAMES, PUBLIC_LOCALES, type PublicLocale } from '@litomi/domain/locale'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { twMerge } from 'tailwind-merge'

import { usePathname, useRouter } from '@/i18n/navigation'

type Props = {
  className?: string
}

export default function LocaleSwitcher({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const menuId = useId()
  const currentLabel = LOCALE_NATIVE_NAMES[currentLocale] ?? currentLocale

  function handleLocaleChange(nextLocale: PublicLocale) {
    setIsOpen(false)

    if (nextLocale === currentLocale || isPending) {
      return
    }

    startTransition(() => {
      const { hash, search } = window.location
      router.push(`${pathname}${search}${hash}`, { locale: nextLocale })
    })
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div className={twMerge('relative inline-block text-left', className)} ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="언어 변경 / Change language"
        className={twMerge(
          'flex h-10 items-center gap-2 rounded-full border border-zinc-700/80 bg-background/80 px-3 text-sm font-medium text-foreground shadow-lg shadow-black/20 backdrop-blur transition',
          'hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60',
        )}
        disabled={isPending}
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <Languages className="size-4 shrink-0" />
        <span lang={LOCALE_LANGUAGE_TAGS[currentLocale]}>{currentLabel}</span>
        <ChevronDown className={twMerge('size-4 shrink-0 transition', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 min-w-44 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950/95 p-1 shadow-xl shadow-black/30 backdrop-blur"
          id={menuId}
          role="menu"
        >
          {PUBLIC_LOCALES.map((locale) => {
            const isSelected = locale === currentLocale
            const label = LOCALE_NATIVE_NAMES[locale]

            return (
              <button
                aria-checked={isSelected}
                className={twMerge(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-zinc-200 transition',
                  'hover:bg-zinc-800 focus:outline-none focus-visible:bg-zinc-800',
                  isSelected && 'text-foreground',
                )}
                key={locale}
                lang={LOCALE_LANGUAGE_TAGS[locale]}
                onClick={() => handleLocaleChange(locale)}
                role="menuitemradio"
                type="button"
              >
                <span className="flex-1 whitespace-nowrap">{label}</span>
                {isSelected && <Check className="size-4 shrink-0 text-brand" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
