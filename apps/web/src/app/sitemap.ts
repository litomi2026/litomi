import type { MetadataRoute } from 'next'

import { env } from '@litomi/env/client'

import { MetricParam, PeriodParam } from './(navigation)/(ranking)/common'

const { NEXT_PUBLIC_APP_ORIGIN } = env

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
  return [
    {
      url: NEXT_PUBLIC_APP_ORIGIN,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.HOME,
    },
    ...generateNewMangaPages(),
    ...generatePopularMangaPages(),
    ...generateRankingPages(),
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/realtime`,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.RANKING,
    },
    ...generateSearchPages(),
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/random`,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.SEARCH,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/library`,
      changeFrequency: 'weekly',
      priority: PRIORITY_LEVELS.LIBRARY,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/library/bookmark`,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.LIBRARY,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/library/history`,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.LIBRARY,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/@`,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.USER_PAGES,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/posts/recommend`,
      changeFrequency: 'monthly',
      priority: PRIORITY_LEVELS.POSTS,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/doc/privacy`,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/doc/terms`,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/doc/youth-protection`,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/doc/2257`,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/doc/dmca`,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/deterrence`,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.LEGAL,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/auth/login`,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.AUTH,
    },
    {
      url: `${NEXT_PUBLIC_APP_ORIGIN}/auth/signup`,
      changeFrequency: 'yearly',
      priority: PRIORITY_LEVELS.AUTH,
    },
  ]
}

function generateNewMangaPages(): MetadataRoute.Sitemap {
  const pages = []

  for (let i = 1; i <= 10; i++) {
    pages.push({
      url: `${NEXT_PUBLIC_APP_ORIGIN}/new/${i}`,
      changeFrequency: 'daily' as const,
      priority: PRIORITY_LEVELS.MAIN_SECTIONS,
    })
  }

  return pages
}

function generatePopularMangaPages(): MetadataRoute.Sitemap {
  const mangaIds = [3542485, 3514353, 3300537, 3510088, 3537321, 3354827, 3300529, 3530486, 3505285, 3382542]
  const pages = []

  for (const mangaId of mangaIds) {
    pages.push({
      url: `${NEXT_PUBLIC_APP_ORIGIN}/manga/${mangaId}`,
      changeFrequency: 'yearly' as const,
      priority: PRIORITY_LEVELS.MANGA_DETAIL,
    })
  }

  return pages
}

function generateRankingPages(): MetadataRoute.Sitemap {
  const pages = []

  for (const metric of Object.values(MetricParam)) {
    for (const period of Object.values(PeriodParam)) {
      pages.push({
        url: `${NEXT_PUBLIC_APP_ORIGIN}/ranking/${metric}/${period}`,
        changeFrequency: 'daily' as const,
        priority: PRIORITY_LEVELS.RANKING,
      })
    }
  }

  return pages
}

function generateSearchPages(): MetadataRoute.Sitemap {
  const pages = []
  const popularTags = ['', 'language:korean', 'type:doujinshi', 'type:manga', 'series:original']

  for (const tag of popularTags) {
    const query = tag ? `query=${encodeURIComponent(tag)}` : ''
    pages.push({
      url: `${NEXT_PUBLIC_APP_ORIGIN}/search?${query}`,
      changeFrequency: 'weekly' as const,
      priority: PRIORITY_LEVELS.SEARCH,
    })
  }

  return pages
}
