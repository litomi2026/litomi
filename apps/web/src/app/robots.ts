import { APP_ORIGIN } from '@litomi/domain/constants'
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
    sitemap: APP_ORIGIN + '/sitemap.xml',
  }
}
