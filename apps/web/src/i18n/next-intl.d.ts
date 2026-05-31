import type { PublicLocale } from '@litomi/domain/locale'

declare module 'next-intl' {
  interface AppConfig {
    Locale: PublicLocale
  }
}
