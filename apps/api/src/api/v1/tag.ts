import { Locale } from '@litomi/catalog/translation/common'
import { translateTag } from '@litomi/catalog/translation/tag'
import { catalogDB } from '@litomi/db/database/catalog/drizzle'
import { mangaTable } from '@litomi/db/database/catalog/schema'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/app'

import { zProblemValidator } from '@/utils/validator'

const TAGS_PER_PAGE = 100

const CategoryParam = ['female', 'male', 'mixed', 'other'] as const
type CategoryParam = (typeof CategoryParam)[number]

const categoryToNumber: Record<CategoryParam, number> = {
  female: 0,
  male: 1,
  mixed: 2,
  other: 3,
}

const querySchema = z.object({
  category: z.enum(CategoryParam),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(TAGS_PER_PAGE).default(TAGS_PER_PAGE),
  locale: z.enum(Locale).default(Locale.KO),
})

export type GETV1TagResponse = {
  tags: TagItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type TagCountRow = {
  value: string
  count: number
}

type TagItem = {
  value: string
  label: string
  count: number
}

type TotalCountRow = {
  count: number
}

const tagRoutes = new Hono<Env>()

tagRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
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
