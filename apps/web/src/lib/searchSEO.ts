import type { Metadata } from 'next'

import { MAX_MANGA_ID } from '@litomi/domain/manga/policy'

import { SearchParam as SearchPageSearchParam } from '@/app/[locale]/(navigation)/search/constants'

type SearchParamsInput = Record<string, string | string[] | undefined>

type SearchSEO = {
  canonical: string
  description: string
  robots: Metadata['robots']
  title: string
}

type SearchSEOCopy = {
  defaultDescription: string
  defaultTitle: string
  landingQueryLabels: Record<string, string>
  queryDescription: (query: string) => string
  queryTitle: (query: string) => string
}

const MAX_SEARCH_META_QUERY_LENGTH = 50

export const SEARCH_LANDING_QUERIES = ['', 'language:korean', 'type:doujinshi', 'type:manga']

export function getSearchCanonicalPath(query: string) {
  const normalizedQuery = normalizeSearchQuery(query).toLowerCase()

  if (!normalizedQuery) {
    return '/search'
  }

  const params = new URLSearchParams({ [SearchPageSearchParam.QUERY]: normalizedQuery })
  return `/search?${params}`
}

export function getSearchSEO(searchParams: SearchParamsInput, copy: SearchSEOCopy): SearchSEO {
  const query = normalizeSearchQuery(readSearchParamValue(searchParams[SearchPageSearchParam.QUERY]))
  const canonicalQuery = query.toLowerCase()
  const displayQuery = formatSearchQuery(query, copy.landingQueryLabels).slice(0, MAX_SEARCH_META_QUERY_LENGTH)

  const hasNonIndexableParams = Object.entries(searchParams).some(([key, value]) => {
    return key !== SearchPageSearchParam.QUERY && readSearchParamValue(value) !== ''
  })

  const idSearchCanonical = getIdSearchCanonicalPath(canonicalQuery)
  const isIndexable = !hasNonIndexableParams && SEARCH_LANDING_QUERIES.includes(canonicalQuery)
  const canonical = idSearchCanonical ?? getSearchCanonicalPath(query)
  const title = displayQuery ? copy.queryTitle(displayQuery) : copy.defaultTitle
  const description = displayQuery ? copy.queryDescription(displayQuery) : copy.defaultDescription

  return {
    canonical,
    description,
    robots: {
      index: isIndexable,
      follow: true,
    },
    title,
  }
}

function formatSearchQuery(query: string, landingQueryLabels: Record<string, string>) {
  if (!query) {
    return ''
  }

  return query
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => landingQueryLabels[token.toLowerCase()] ?? token)
    .join(' · ')
}

function getIdSearchCanonicalPath(query: string) {
  const match = query.match(/^id:(\d+)$/)

  if (!match) {
    return null
  }

  const id = Number(match[1])
  return id > 0 && id <= MAX_MANGA_ID ? `/manga/${id}` : null
}

function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, ' ')
}

function readSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? ''
  }

  return value?.trim() ?? ''
}
