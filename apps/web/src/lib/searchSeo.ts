import type { Metadata } from 'next'

import { MAX_MANGA_ID } from '@litomi/domain/manga/policy'

type SearchParamsInput = Record<string, string | string[] | undefined>

type SearchSEO = {
  canonical: string
  description: string
  robots: Metadata['robots']
  title: string
}

const MAX_SEARCH_META_QUERY_LENGTH = 50

const SEARCH_LANDING_QUERY_LABELS: Record<string, string> = {
  'language:korean': '한국어 작품',
  'type:doujinshi': '동인지',
  'type:manga': '망가',
}

export const SEARCH_LANDING_QUERIES = ['', ...Object.keys(SEARCH_LANDING_QUERY_LABELS)]

export function getSearchCanonicalPath(query: string) {
  const normalizedQuery = normalizeSearchQuery(query).toLowerCase()

  if (!normalizedQuery) {
    return '/search'
  }

  const params = new URLSearchParams({ query: normalizedQuery })
  return `/search?${params}`
}

export function getSearchSEO(searchParams: SearchParamsInput): SearchSEO {
  const query = normalizeSearchQuery(readSearchParamValue(searchParams.query))
  const canonicalQuery = query.toLowerCase()
  const displayQuery = formatSearchQuery(query).slice(0, MAX_SEARCH_META_QUERY_LENGTH)

  const hasNonIndexableParams = Object.entries(searchParams).some(([key, value]) => {
    return key !== 'query' && readSearchParamValue(value) !== ''
  })

  const idSearchCanonical = getIdSearchCanonicalPath(canonicalQuery)
  const isIndexable = !hasNonIndexableParams && SEARCH_LANDING_QUERIES.includes(canonicalQuery)
  const canonical = idSearchCanonical ?? getSearchCanonicalPath(query)
  const title = displayQuery ? `${displayQuery} 검색` : '검색'

  const description = displayQuery
    ? `${displayQuery} 조건에 맞는 만화와 동인지를 리토미에서 찾아보세요.`
    : '리토미에서 언어, 종류, 작가, 시리즈, 캐릭터, 태그 조건으로 만화와 동인지를 검색하세요.'

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

function formatSearchQuery(query: string) {
  if (!query) {
    return ''
  }

  return query
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => SEARCH_LANDING_QUERY_LABELS[token.toLowerCase()] ?? token)
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
