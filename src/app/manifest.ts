import type { MetadataRoute } from 'next'

import { APPLICATION_NAME, CANONICAL_URL, DESCRIPTION, SHORT_NAME, THEME_COLOR } from '@/constants'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APPLICATION_NAME,
    short_name: SHORT_NAME,
    description: DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
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
