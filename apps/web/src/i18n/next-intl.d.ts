import type { SupportedLocale } from './routing'

declare module 'next-intl' {
  interface AppConfig {
    Locale: SupportedLocale
  }
}
