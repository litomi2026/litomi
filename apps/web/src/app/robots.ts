import { type MetadataRoute } from 'next'

import { APP_ORIGIN } from '@/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: ['Yandex'],
        disallow: '/',
      },
    ],
    sitemap: APP_ORIGIN + '/sitemap.xml',
  }
}
