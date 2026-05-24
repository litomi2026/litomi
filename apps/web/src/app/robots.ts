import { env } from '@litomi/env/client'
import { type MetadataRoute } from 'next'

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
    sitemap: env.NEXT_PUBLIC_APP_ORIGIN + '/sitemap.xml',
  }
}
