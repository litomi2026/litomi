import { NextRequest } from 'next/server'

import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

import { type GETSearchSuggestionsResponse, GETSearchSuggestionsSchema, queryBlacklist } from './schema'
import { suggestionTrie } from './suggestion-trie'

export const runtime = 'edge'
const maxAge = 86400 // 1 day

export async function GET(request: NextRequest | Request) {
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

    return Response.json(suggestions satisfies GETSearchSuggestionsResponse, {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          maxAge,
          sMaxAge: maxAge,
          staleWhileRevalidate: maxAge,
        }),
      },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
