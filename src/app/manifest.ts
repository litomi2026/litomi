import type { MetadataRoute } from 'next'

import { DESCRIPTION, SHORT_NAME } from '@/constants'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Litomi - Manga mirror site',
    short_name: SHORT_NAME,
    description: DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
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
