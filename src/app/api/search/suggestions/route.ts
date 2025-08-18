import ms from 'ms'

import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

import { type GETSearchSuggestionsResponse, GETSearchSuggestionsSchema, queryBlacklist } from './schema'
import { suggestionTrie } from './suggestion-trie'

export const runtime = 'edge'
const revalidate = ms('3 days') / 1000

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams)
  const validation = GETSearchSuggestionsSchema.safeParse(params)

  if (!validation.success) {
    return new Response('400 Bad Request', { status: 400 })
  }

  const { query, locale } = validation.data

  if (queryBlacklist.some((regex) => regex.test(query))) {
    return new Response('400 Bad Request', { status: 400 })
  }

  try {
    const suggestions = suggestionTrie.search(query, locale)

    const cacheControl = createCacheControl({
      public: true,
      maxAge: revalidate,
      sMaxAge: revalidate,
      swr: revalidate,
    })

    return Response.json(suggestions satisfies GETSearchSuggestionsResponse, {
      headers: { 'Cache-Control': cacheControl },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
