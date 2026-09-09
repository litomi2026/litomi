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
  "relative flex items-center gap-2 rounded-full px-2 py-2 text-foreground transition hover:bg-zinc-900 sm:px-3 before:content-[''] before:absolute before:-inset-x-0.5 before:-inset-y-1"
