export const LIVE_CAM_AD_URL =
  'https://t.nettrck.store/c1/d012584b-d43a-4900-9811-bdeaca53b632?externalId={impressionId}&cv1={impressionId}&cv2={userId}&cv3={device}&cv4={creativeId}&cv5={campaignId}&cv6={language}&cv7=%SLAVA_KPSS%&cv8={browser}&cv9={siteId}&cv10={creativeName}'

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
