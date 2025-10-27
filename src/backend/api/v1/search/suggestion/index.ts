import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { Env } from '@/backend'
import { createCacheControlHeaders } from '@/crawler/proxy-utils'
import { sec } from '@/utils/date'

import { queryBlacklist, querySchema } from './schema'
import { suggestionTrie } from './suggestion-trie'

const suggestionRoutes = new Hono<Env>()

suggestionRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const { query, locale } = c.req.valid('query')

  if (queryBlacklist.some((regex) => regex.test(query))) {
    throw new HTTPException(400)
  }

  const suggestions = suggestionTrie.search(query, locale)

  const cacheControlHeader = createCacheControlHeaders({
    vercel: {
      maxAge: sec('30 days'),
    },
    browser: {
      public: true,
      maxAge: 3,
      sMaxAge: sec('30 days'),
      swr: sec('1 day'),
    },
  })

  return c.json(suggestions, { headers: cacheControlHeader })
})

export default suggestionRoutes
