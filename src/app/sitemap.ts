import type { MetadataRoute } from 'next'

import { CANONICAL_URL } from '@/constants'

import { MetricParam, PeriodParam } from './(navigation)/(ranking)/common'

const PRIORITY_LEVELS = {
  HOME: 1.0,
  MAIN_SECTIONS: 0.9,
  MANGA_DETAIL: 0.8,
  RANKING: 0.7,
  SEARCH: 0.6,
  LIBRARY: 0.5,
  USER_PAGES: 0.4,
  POSTS: 0.3,
  LEGAL: 0.2,
  AUTH: 0.1,
} as const

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: CANONICAL_URL,
      lastModified,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.HOME,
    },
    ...generateNewMangaPages(lastModified),
    ...generatePopularMangaPages(lastModified),
    ...generateRankingPages(lastModified),
    {
      url: `${CANONICAL_URL}/realtime`,
      lastModified,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.RANKING,
    },
    ...generateSearchPages(lastModified),
    {
      url: `${CANONICAL_URL}/random`,
      lastModified,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.SEARCH,
    },
    {
      url: `${CANONICAL_URL}/library`,
      lastModified,
      changeFrequency: 'weekly',
      priority: PRIORITY_LEVELS.LIBRARY,
    },
    {
      url: `${CANONICAL_URL}/library/bookmark`,
      lastModified,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.LIBRARY,
    },
    {
      url: `${CANONICAL_URL}/library/history`,
      lastModified,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.LIBRARY,
    },
    {
      url: `${CANONICAL_URL}/@`,
      lastModified,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.USER_PAGES,
    },
    {
      url: `${CANONICAL_URL}/posts/recommand`,
      lastModified,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.POSTS,
    },
    {
      url: `${CANONICAL_URL}/doc/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${CANONICAL_URL}/doc/terms`,
      lastModified,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${CANONICAL_URL}/doc/dmca`,
      lastModified,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${CANONICAL_URL}/deterrence`,
      lastModified,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${CANONICAL_URL}/auth/login`,
      lastModified,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.AUTH,
    },
    {
      url: `${CANONICAL_URL}/auth/signup`,
      lastModified,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.AUTH,
    },
  ]
}

function generateNewMangaPages(lastModified: Date): MetadataRoute.Sitemap {
  const pages = []

  for (let i = 1; i <= 9; i++) {
    pages.push({
      url: `${CANONICAL_URL}/new/${i}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: PRIORITY_LEVELS.MAIN_SECTIONS,
    })
  }

  return pages
}

function generatePopularMangaPages(lastModified: Date): MetadataRoute.Sitemap {
  const mangaIds = [3542485, 3514353, 3300537, 3510088, 3537321, 3354827, 3300529, 3530486, 3505285, 3382542]
  const pages = []

  for (const mangaId of mangaIds) {
    pages.push({
      url: `${CANONICAL_URL}/manga/${mangaId}`,
      lastModified,
      changeFrequency: 'yearly' as const,
      priority: PRIORITY_LEVELS.MANGA_DETAIL,
    })
  }

  return pages
}

function generateRankingPages(lastModified: Date): MetadataRoute.Sitemap {
  const pages = []

  for (const metric of Object.values(MetricParam)) {
    for (const period of Object.values(PeriodParam)) {
      pages.push({
        url: `${CANONICAL_URL}/ranking/${metric}/${period}`,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: PRIORITY_LEVELS.RANKING,
      })
    }
  }

  return pages
}

function generateSearchPages(lastModified: Date): MetadataRoute.Sitemap {
  const pages = []
  const popularTags = ['', 'language:korean', 'type:doujinshi', 'type:manga', 'series:original']

  for (const tag of popularTags) {
    const query = tag ? `query=${encodeURIComponent(tag)}` : ''
    pages.push({
      url: `${CANONICAL_URL}/search?${query}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: PRIORITY_LEVELS.SEARCH,
    })
  }

  return pages
}
