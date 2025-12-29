import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { Locale } from '@/translation/common'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

import { queryBlacklist } from './constant'
import { suggestionTrie } from './suggestion-trie'

const suggestionRoutes = new Hono<Env>()

const querySchema = z.object({
  locale: z.enum(Locale).default(Locale.KO),
  query: z.string().trim().min(2).max(200),
})

export type GETSearchSuggestionsResponse = {
  label: string
  value: string
}[]

suggestionRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
  const { locale, query } = c.req.valid('query')

  if (queryBlacklist.some((regex) => regex.test(query))) {
    return problemResponse(c, { status: 400 })
  }

  const suggestions = suggestionTrie.search(query, locale)

  const cacheControl = createCacheControl({
    public: true,
    maxAge: 3,
    sMaxAge: sec('30 days'),
    swr: sec('1 day'),
  })

  return c.json<GETSearchSuggestionsResponse>(suggestions, { headers: { 'Cache-Control': cacheControl } })
})

export default suggestionRoutes
