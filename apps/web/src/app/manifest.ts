import type { MetadataRoute } from 'next'

import { APPLICATION_NAME, DESCRIPTION, SHORT_NAME, THEME_COLOR } from '@litomi/domain/app/metadata'

import { DEFAULT_LOCALE } from '@/i18n/routing'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APPLICATION_NAME,
    short_name: SHORT_NAME,
    description: DESCRIPTION,
    start_url: `/${DEFAULT_LOCALE}`,
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    background_color: THEME_COLOR,
    id: `/${DEFAULT_LOCALE}`,
    theme_color: THEME_COLOR,
    screenshots: [
      {
        src: '/image/desktop-search.avif',
        sizes: '3680x2262',
        type: 'image/avif',
        form_factor: 'wide',
        label: '데스크톱 검색',
      },
      {
        src: '/image/desktop-bookmark.avif',
        sizes: '3680x2262',
        type: 'image/avif',
        form_factor: 'wide',
        label: '데스크톱 북마크',
      },
      {
        src: '/image/mobile-search.avif',
        sizes: '1224x2262',
        type: 'image/avif',
        form_factor: 'narrow',
        label: '모바일 검색',
      },
      {
        src: '/image/mobile-bookmark.avif',
        sizes: '1224x2262',
        type: 'image/avif',
        form_factor: 'narrow',
        label: '모바일 북마크',
      },
    ],
    protocol_handlers: [
      {
        protocol: 'web+litomi',
        url: `/${DEFAULT_LOCALE}?protocol=web+litomi&url=%s`,
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
  }
}
