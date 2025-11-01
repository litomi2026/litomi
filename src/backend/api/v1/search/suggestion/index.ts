import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

import { Env } from '@/backend'
import { createCacheControl } from '@/crawler/proxy-utils'
import { Locale } from '@/translation/common'
import { sec } from '@/utils/date'

import { queryBlacklist } from './constant'
import { suggestionTrie } from './suggestion-trie'

const suggestionRoutes = new Hono<Env>()

const querySchema = z.object({
  query: z.string().trim().min(2).max(200),
  locale: z.enum(Locale).optional(),
})

export type GETSearchSuggestionsResponse = {
  label: string
  value: string
}[]

suggestionRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const { query, locale } = c.req.valid('query')

  if (queryBlacklist.some((regex) => regex.test(query))) {
    throw new HTTPException(400)
  }

  const suggestions = suggestionTrie.search(query, locale)

  const cacheControl = createCacheControl({
    public: true,
    maxAge: 3,
    sMaxAge: sec('30 days'),
    swr: sec('1 day'),
  })

  return c.json(suggestions, { headers: { 'Cache-Control': cacheControl } })
})

export default suggestionRoutes
