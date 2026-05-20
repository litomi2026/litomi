import { translateTag } from '@litomi/catalog/translation/tag'
import { getV1TagQuerySchema, type GETV1TagResponse, type TagCategoryParam, type TagItem } from '@litomi/contracts'
import { catalogDB } from '@litomi/db/catalog'
import { mangaTable } from '@litomi/db/catalog/schema'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { zProblemValidator } from '@/utils/validator'

const categoryToNumber: Record<TagCategoryParam, number> = {
  female: 0,
  male: 1,
  mixed: 2,
  other: 3,
}

type TagCountRow = {
  value: string
  count: number
}

type TotalCountRow = {
  count: number
}

const tagRoutes = new Hono<Env>()

tagRoutes.get('/', zProblemValidator('query', getV1TagQuerySchema), async (c) => {
  const { category, page, limit, locale } = c.req.valid('query')
  const categoryNumber = categoryToNumber[category]
  const offset = (page - 1) * limit

  const [tagsWithCount, totalCountRow] = await Promise.all([
    catalogDB.execute(sql`
      SELECT tag.value, count(*)::integer AS count
      FROM ${mangaTable}
      CROSS JOIN LATERAL unnest(${mangaTable.tagValues}, ${mangaTable.tagCategories}) AS tag(value, category)
      WHERE tag.category = ${categoryNumber}
      GROUP BY tag.value
      ORDER BY count DESC, tag.value
      LIMIT ${limit}
      OFFSET ${offset}
    `) as Promise<TagCountRow[]>,
    catalogDB.execute(sql`
      SELECT count(*)::integer AS count
      FROM (
        SELECT DISTINCT tag.value
        FROM ${mangaTable}
        CROSS JOIN LATERAL unnest(${mangaTable.tagValues}, ${mangaTable.tagCategories}) AS tag(value, category)
        WHERE tag.category = ${categoryNumber}
      ) tags
    `) as Promise<TotalCountRow[]>,
  ])

  const totalCount = totalCountRow[0]?.count ?? 0
  const totalPages = Math.ceil(totalCount / limit)

  const tags: TagItem[] = tagsWithCount.map(({ value, count }) => ({
    value: `${category}:${value}`,
    label: translateTag(category, value, locale).label,
    count,
  }))

  const cacheControl = createCacheControl({
    public: true,
    maxAge: 3,
    sMaxAge: sec('90 days'),
    swr: sec('1 day'),
  })

  const response: GETV1TagResponse = {
    tags,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
    },
  }

  return c.json<GETV1TagResponse>(response, { headers: { 'Cache-Control': cacheControl } })
})

export default tagRoutes
