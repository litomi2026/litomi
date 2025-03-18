import type { MetadataRoute } from 'next'

import { CANONICAL_URL } from '@/constants/url'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${CANONICAL_URL}/manga`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: CANONICAL_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${CANONICAL_URL}/deterrence`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    {
      url: `${CANONICAL_URL}/doc/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    {
      url: `${CANONICAL_URL}/doc/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
  ]
}
