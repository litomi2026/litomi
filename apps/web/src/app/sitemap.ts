import { PUBLIC_LOCALES } from '@litomi/domain/locale'
import { env } from '@litomi/env/client'
import type { MetadataRoute } from 'next'

import { getPathname } from '@/i18n/navigation'
import { getSearchCanonicalPath, SEARCH_LANDING_QUERIES } from '@/lib/searchSEO'

import { MetricParam, PeriodParam } from './[locale]/(navigation)/(ranking)/common'

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
    ...localizedSitemapEntries('/new', 'daily', PRIORITY_LEVELS.MAIN_SECTIONS),
    ...generateSearchPages(),
    ...generateRankingPages(),
    ...generatePopularMangaPages(),
    ...localizedSitemapEntries('/', 'monthly', PRIORITY_LEVELS.HOME),
    ...localizedSitemapEntries('/realtime', 'monthly', PRIORITY_LEVELS.RANKING),
    ...localizedSitemapEntries('/random', 'monthly', PRIORITY_LEVELS.SEARCH),
    ...localizedSitemapEntries('/library', 'monthly', PRIORITY_LEVELS.LIBRARY),
    ...localizedSitemapEntries('/library/bookmark', 'monthly', PRIORITY_LEVELS.LIBRARY),
    ...localizedSitemapEntries('/library/history', 'monthly', PRIORITY_LEVELS.LIBRARY),
    ...localizedSitemapEntries('/@', 'monthly', PRIORITY_LEVELS.USER_PAGES),
    ...localizedSitemapEntries('/posts/recommend', 'monthly', PRIORITY_LEVELS.POSTS),
    ...localizedSitemapEntries('/doc/privacy', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/doc/terms', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/doc/youth-protection', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/doc/2257', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/doc/dmca', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/deterrence', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/auth/login', 'yearly', PRIORITY_LEVELS.AUTH),
    ...localizedSitemapEntries('/auth/signup', 'yearly', PRIORITY_LEVELS.AUTH),
  ]
}

function generatePopularMangaPages(): MetadataRoute.Sitemap {
  const mangaIds = [3542485, 3514353, 3300537, 3510088, 3537321, 3354827, 3300529, 3530486, 3505285, 3382542]
  const pages = []

  for (const mangaId of mangaIds) {
    pages.push(...localizedSitemapEntries(`/manga/${mangaId}`, 'yearly', PRIORITY_LEVELS.MANGA_DETAIL))
  }

  return pages
}

function generateRankingPages(): MetadataRoute.Sitemap {
  const pages = []

  for (const metric of Object.values(MetricParam)) {
    for (const period of Object.values(PeriodParam)) {
      pages.push(...localizedSitemapEntries(`/ranking/${metric}/${period}`, 'monthly', PRIORITY_LEVELS.RANKING))
    }
  }

  return pages
}

function generateSearchPages(): MetadataRoute.Sitemap {
  const pages = []

  for (const query of SEARCH_LANDING_QUERIES) {
    pages.push(...localizedSitemapEntries(getSearchCanonicalPath(query), 'weekly', PRIORITY_LEVELS.SEARCH))
  }

  return pages
}

function localizedSitemapEntries(
  path: string,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>,
  priority: number,
): MetadataRoute.Sitemap {
  return PUBLIC_LOCALES.map((locale) => ({
    url: new URL(getPathname({ href: path, locale }), NEXT_PUBLIC_APP_ORIGIN).toString(),
    changeFrequency,
    priority,
  }))
}
