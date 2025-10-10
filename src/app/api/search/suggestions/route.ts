import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { sec } from '@/utils/date'

import { GETSearchSuggestionsSchema, queryBlacklist } from './schema'
import { suggestionTrie } from './suggestion-trie'

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
      maxAge: sec('30 days'),
      sMaxAge: sec('1 day'),
      swr: sec('1 day'),
    })

    return Response.json(suggestions, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
