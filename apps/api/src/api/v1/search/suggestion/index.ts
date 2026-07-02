import { type GETSearchSuggestionsResponse, getSearchSuggestionsQuerySchema } from '@litomi/contracts'
import { queryBlacklist } from '@litomi/domain/search/suggestion'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { suggestionTrie } from './suggestion-trie'

const suggestionRoutes = new Hono<Env>()

suggestionRoutes.get('/', zProblemValidator('query', getSearchSuggestionsQuerySchema), async (c) => {
  const { limit, locale, query } = c.req.valid('query')

  if (queryBlacklist.some((regex) => regex.test(query))) {
    return problemResponse(c, { status: 400 })
  }

  const suggestions = suggestionTrie.search(query, locale, limit)

  const cacheControl = createCacheControl({
    public: true,
    maxAge: 3,
    sMaxAge: sec('90 days'),
    swr: sec('1 day'),
  })

  return c.json(suggestions satisfies GETSearchSuggestionsResponse, { headers: { 'Cache-Control': cacheControl } })
})

export default suggestionRoutes
