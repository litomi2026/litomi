import { translateArtistList } from '@litomi/catalog/translation/artist'
import { translateCategory } from '@litomi/catalog/translation/category'
import { translateCharacterList } from '@litomi/catalog/translation/character'
import { translateGroupList } from '@litomi/catalog/translation/group'
import { translateLanguage } from '@litomi/catalog/translation/language'
import { translateSeriesList } from '@litomi/catalog/translation/series'
import { translateTag } from '@litomi/catalog/translation/tag'
import { translateType } from '@litomi/catalog/translation/type'
import { getTrendingKeywordsQuerySchema, type GETTrendingKeywordsResponse, TrendingType } from '@litomi/contracts'
import { Locale } from '@litomi/domain/locale'
import { normalizeValue } from '@litomi/domain/utils/normalize-value'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { trendingKeywordsService } from '@/services/TrendingKeywordsService'
import { zProblemValidator } from '@/utils/validator'

const trendingRoutes = new Hono<Env>()

type ParsedCategoryToken = {
  isExcluded: boolean
  category: string
  value: string
}

function formatPlainText(text: string): string {
  return text.replaceAll('_', ' ')
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

trendingRoutes.get('/', zProblemValidator('query', getTrendingKeywordsQuerySchema), async (c) => {
  const { limit, locale, type } = c.req.valid('query')

  const { keywords = [], cacheMaxAge } = {
    [TrendingType.DAILY]: {
      // keywords: await trendingKeywordsService.getTrendingDaily(limit),
      cacheMaxAge: sec('1 day'),
    },
    [TrendingType.HOURLY]: {
      keywords: await trendingKeywordsService.getTrendingHourly(limit),
      cacheMaxAge: sec('2 minutes'),
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

  const cacheControl =
    response.keywords.length > 0
      ? createCacheControl({
          public: true,
          maxAge: 3,
          sMaxAge: cacheMaxAge,
          swr: Math.floor(cacheMaxAge / 2),
        })
      : createCacheControl({
          public: true,
          maxAge: 1,
          sMaxAge: 10,
          swr: 0,
        })

  return c.json<GETTrendingKeywordsResponse>(response, { headers: { 'Cache-Control': cacheControl } })
})

export default trendingRoutes
