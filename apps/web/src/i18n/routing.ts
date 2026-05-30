import { DEFAULT_LOCALE, PUBLIC_LOCALES } from '@litomi/domain/locale'
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: PUBLIC_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
})
