import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { zProblemValidator } from '@/backend/utils/validator'
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

type ParsedCategoryToken = {
  isExcluded: boolean
  category: string
  value: string
}

function formatPlainText(text: string): string {
  return text.replace(/_/g, ' ')
}

function normalizeCategory(rawCategory: string): string {
  const normalized = normalizeValue(rawCategory.replace(/^-+/, ''))

  if (normalized === 'parody') {
    return 'series'
  }

  return normalized
}

function parseCategoryToken(token: string): ParsedCategoryToken | null {
  const trimmed = token.trim()
  if (!trimmed) {
    return null
  }

  const isExcluded = trimmed.startsWith('-')
  const withoutPrefix = isExcluded ? trimmed.replace(/^-+/, '') : trimmed
  const colonIndex = withoutPrefix.indexOf(':')

  if (colonIndex <= 0) {
    return null
  }

  const category = withoutPrefix.slice(0, colonIndex)
  const value = withoutPrefix.slice(colonIndex + 1)

  return { isExcluded, category, value }
}

function translateSearchQuery(category: string, value: string, locale: Locale): string {
  const normalizedCategory = normalizeCategory(category)
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    switch (normalizedCategory) {
      case 'female':
      case 'male':
      case 'mixed':
      case 'other': {
        const tagLabel = translateTag(normalizedCategory, '', locale).label
        return tagLabel.endsWith(':') ? tagLabel.slice(0, -1) : tagLabel
      }
      default: {
        return translateCategory(normalizedCategory, locale)
      }
    }
  }

  switch (normalizedCategory) {
    case 'artist': {
      const artistLabel = translateArtistList([trimmedValue], locale)
      return `${translateCategory(normalizedCategory, locale)}:${artistLabel?.[0].label || formatPlainText(trimmedValue)}`
    }
    case 'character': {
      const characterLabel = translateCharacterList([trimmedValue], locale)
      return `${translateCategory(normalizedCategory, locale)}:${characterLabel?.[0].label || formatPlainText(trimmedValue)}`
    }
    case 'female':
    case 'male':
    case 'mixed':
    case 'other': {
      return translateTag(normalizedCategory, trimmedValue, locale).label
    }
    case 'group': {
      const groupLabel = translateGroupList([trimmedValue], locale)
      return `${translateCategory(normalizedCategory, locale)}:${groupLabel?.[0].label || formatPlainText(trimmedValue)}`
    }
    case 'language': {
      return translateLanguage(normalizeValue(trimmedValue), locale)
    }
    case 'series': {
      const seriesLabel = translateSeriesList([trimmedValue], locale)
      return `${translateCategory(normalizedCategory, locale)}:${seriesLabel?.[0].label || formatPlainText(trimmedValue)}`
    }
    case 'type': {
      const typeObj = translateType(trimmedValue, locale)
      return `${translateCategory(normalizedCategory, locale)}:${typeObj?.label || formatPlainText(trimmedValue)}`
    }
    case 'uploader': {
      return `${translateCategory(normalizedCategory, locale)}:${formatPlainText(trimmedValue)}`
    }
    default:
      return `${translateCategory(normalizedCategory, locale)}:${formatPlainText(trimmedValue)}`
  }
}

function translateTrendingKeyword(keyword: string, locale: Locale): string {
  if (typeof keyword !== 'string') {
    console.error('translateTrendingKeyword: keyword is not a string', locale, JSON.stringify(keyword))
    return ''
  }

  const trimmed = keyword.trim()
  if (!trimmed) {
    return ''
  }

  if (!trimmed.includes(':')) {
    return formatPlainText(trimmed)
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  const segments: string[] = []
  let plainBuffer: string[] = []

  function flushPlainBuffer() {
    if (plainBuffer.length === 0) {
      return
    }
    segments.push(formatPlainText(plainBuffer.join(' ')))
    plainBuffer = []
  }

  for (const part of parts) {
    const parsed = parseCategoryToken(part)
    if (!parsed) {
      plainBuffer.push(part)
      continue
    }

    flushPlainBuffer()

    const translated = translateSearchQuery(parsed.category, parsed.value, locale)
    segments.push(parsed.isExcluded ? `-${translated}` : translated)
  }

  flushPlainBuffer()

  return segments.join(', ')
}

trendingRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
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
