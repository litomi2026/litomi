import type { MetadataRoute } from 'next'

import { APPLICATION_NAME, CANONICAL_URL, DESCRIPTION, SHORT_NAME, THEME_COLOR } from '@/constants'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APPLICATION_NAME,
    short_name: SHORT_NAME,
    description: DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    background_color: THEME_COLOR,
    id: `${CANONICAL_URL}/`,
    theme_color: THEME_COLOR,
    screenshots: [
      {
        src: '/image/search.webp',
        sizes: '3680x2244',
        type: 'image/webp',
        form_factor: 'wide',
        label: '데스크톱 화면이에요',
      },
      {
        src: '/image/bookmark.webp',
        sizes: '3680x2244',
        type: 'image/webp',
        form_factor: 'wide',
        label: '데스크톱 화면이에요',
      },
      {
        src: '/image/settings.webp',
        sizes: '1226x2244',
        type: 'image/webp',
        form_factor: 'narrow',
        label: '모바일 화면이에요',
      },
    ],
    protocol_handlers: [
      {
        protocol: 'web+litomi',
        url: '/?protocol=web+litomi&url=%s',
      },
    ],
    icons: [
      {
        src: '/web-app-manifest-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    related_applications: [
      {
        platform: 'webapp',
        url: `${CANONICAL_URL}/manifest.webmanifest`,
      },
    ],
  }
}
