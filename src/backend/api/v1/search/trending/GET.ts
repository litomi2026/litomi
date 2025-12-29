import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { trendingKeywordsService } from '@/services/TrendingKeywordsService'
import { translateArtistList } from '@/translation/artist'
import { translateCategory } from '@/translation/category'
import { translateCharacterList } from '@/translation/character'
import { Locale, normalizeValue } from '@/translation/common'
import { translateGroupList } from '@/translation/group'
import { translateLanguage } from '@/translation/language'
import { translateSeriesList } from '@/translation/series'
import { translateTag } from '@/translation/tag'
import { translateType } from '@/translation/type'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

enum TrendingType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(10).default(10),
  locale: z.enum(Locale).default(Locale.KO),
  type: z.enum(TrendingType).default(TrendingType.HOURLY),
})

export type GETTrendingKeywordsResponse = {
  keywords: {
    value: string
    label: string
  }[]
  updatedAt: Date
}

const trendingRoutes = new Hono<Env>()

function translateSearchQuery(category: string, value: string, locale: Locale): string {
  switch (category) {
    case 'artist': {
      const artistLabel = translateArtistList([value], locale)
      return `${translateCategory(category, locale)}:${artistLabel?.[0].label || value}`
    }
    case 'character': {
      const characterLabel = translateCharacterList([value], locale)
      return `${translateCategory(category, locale)}:${characterLabel?.[0].label || value}`
    }
    case 'female':
    case 'male':
    case 'mixed':
    case 'other': {
      return translateTag(category, value, locale).label
    }
    case 'group': {
      const groupLabel = translateGroupList([value], locale)
      return `${translateCategory(category, locale)}:${groupLabel?.[0].label || value}`
    }
    case 'language': {
      return translateLanguage(normalizeValue(value), locale)
    }
    case 'series': {
      const seriesLabel = translateSeriesList([value], locale)
      return `${translateCategory(category, locale)}:${seriesLabel?.[0].label || value}`
    }
    case 'type': {
      const typeObj = translateType(value, locale)
      return `${translateCategory(category, locale)}:${typeObj?.label || value}`
    }
    case 'uploader': {
      return `${translateCategory(category, locale)}:${value.replace(/_/g, ' ')}`
    }
    default:
      return value
  }
}

function translateTrendingKeyword(keyword: string, locale: Locale): string {
  if (typeof keyword !== 'string') {
    console.error('translateTrendingKeyword: keyword is not a string', locale, JSON.stringify(keyword))
    return ''
  }

  if (!keyword.includes(':')) {
    return keyword
  }

  return keyword
    .split(' ')
    .map((word) => {
      if (!word.includes(':')) {
        return word
      }
      const colonIndex = word.indexOf(':')
      const category = word.slice(0, colonIndex)
      const value = word.slice(colonIndex + 1)
      return translateSearchQuery(category, value, locale)
    })
    .join(', ')
}

trendingRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const { limit, locale, type } = c.req.valid('query')

  const { keywords = [], cacheMaxAge } = {
    [TrendingType.DAILY]: {
      // keywords: await trendingKeywordsService.getTrendingDaily(limit),
      cacheMaxAge: sec('1 day'),
    },
    [TrendingType.HOURLY]: {
      keywords: await trendingKeywordsService.getTrendingHourly(limit),
      cacheMaxAge: sec('1 hour'),
    },
    [TrendingType.WEEKLY]: {
      // keywords: await trendingKeywordsService.getTrendingHistorical(7, limit),
      cacheMaxAge: sec('1 week'),
    },
  }[type]

  const response: GETTrendingKeywordsResponse = {
    keywords: keywords.map(({ keyword }) => ({
      value: keyword,
      label: translateTrendingKeyword(keyword, locale),
    })),
    updatedAt: new Date(),
  }

  const cacheControl = createCacheControl({
    public: true,
    maxAge: 3,
    sMaxAge: cacheMaxAge,
    swr: Math.floor(cacheMaxAge / 2),
  })

  return c.json<GETTrendingKeywordsResponse>(response, { headers: { 'Cache-Control': cacheControl } })
})

export default trendingRoutes
