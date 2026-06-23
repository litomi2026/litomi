import { Locale, type PublicLocale } from '@litomi/domain/locale'

export const LIVE_CAM_AD_URL_BY_LOCALE = {
  [Locale.KO]: 'https://en.hotzcam.com/girls/korean',
  [Locale.EN]: 'https://en.hotzcam.com/girls/world-tournament',
  [Locale.JA]: 'https://ja.hotzcam.com/girls/japanese',
  [Locale.ZH_CN]: 'https://zh.hotzcam.com/girls/chinese',
} satisfies Record<PublicLocale, string>

export const TOR_LINKS = {
  braveBrowserTor: {
    href: 'https://support.brave.app/hc/articles/360018121491',
    label: 'Brave Browser Tor',
  },
  onionBrowser: {
    href: 'https://apps.apple.com/kr/app/onion-browser/id519296448',
    label: 'Onion Browser + Orbot',
  },
  torBrowser: {
    href: 'https://www.torproject.org/download/',
    label: 'Tor Browser',
  },
} as const

export const topNavigationActionClassName =
  'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-foreground transition hover:bg-zinc-900'
