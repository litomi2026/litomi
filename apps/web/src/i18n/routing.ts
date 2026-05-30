import { Locale } from '@litomi/domain/locale'
import { defineRouting } from 'next-intl/routing'

export const DEFAULT_LOCALE = Locale.KO
export const SUPPORTED_LOCALES = [Locale.KO, Locale.EN] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
})
